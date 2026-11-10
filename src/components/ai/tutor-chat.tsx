"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { TutorComposer } from "@/components/ai/tutor-composer";
import { TutorConversationSidebar } from "@/components/ai/tutor-conversation-sidebar";
import {
  TutorMessageList,
} from "@/components/ai/tutor-message-list";
import { TutorModeToolbar } from "@/components/ai/tutor-mode-toolbar";
import type {
  TutorConversation,
  TutorError,
  TutorLessonOption,
  TutorMessage,
  TutorPayload,
} from "@/components/ai/tutor-chat-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, truncate } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";

export type { TutorConversation, TutorLessonOption } from "@/components/ai/tutor-chat-types";

const actionEndpoints: Partial<Record<AiAction, string>> = {
  explain_code: "/api/ai/explain",
  debug_code: "/api/ai/debug",
  hint: "/api/ai/hint",
};

const codeActions = new Set<AiAction>(["explain_code", "debug_code", "code_review"]);
const nonRetryableApiErrors = new Set([
  "quota_exceeded",
  "ai_disabled",
  "ai_unconfigured",
  "invalid_model",
  "feature_disabled",
  "validation_error",
  "message_too_long",
  "lesson_not_found",
  "conversation_not_found",
]);

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

type StreamEvent = {
  type?: string;
  text?: string;
  conversationId?: string;
  title?: string;
  remaining?: number;
  code?: string;
  message?: string;
  retryable?: boolean;
  saved?: boolean;
};

export function TutorChat({
  initialConversations = [],
  lessonOptions = [],
  defaultLessonId = null,
  fixedLesson = null,
  defaultLanguage = "id",
  initialUsed = 0,
  dailyLimit = 30,
  aiConfigured = true,
  modelLabel = "Groq model",
  embedded = false,
  autoFocus = false,
  initialCode = "",
  initialCodeLanguage = "html",
  onClose,
}: {
  initialConversations?: TutorConversation[];
  lessonOptions?: TutorLessonOption[];
  defaultLessonId?: string | null;
  fixedLesson?: { id: string; title: string } | null;
  defaultLanguage?: "id" | "en";
  initialUsed?: number;
  dailyLimit?: number;
  aiConfigured?: boolean;
  modelLabel?: string;
  embedded?: boolean;
  autoFocus?: boolean;
  initialCode?: string;
  initialCodeLanguage?: "html" | "css" | "javascript";
  onClose?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allConversations, setAllConversations] = React.useState(initialConversations);
  const [searchResults, setSearchResults] = React.useState<TutorConversation[] | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<TutorMessage[]>([]);
  const [mode, setMode] = React.useState<AiAction>("free_chat");
  const [message, setMessage] = React.useState("");
  const [code, setCode] = React.useState(initialCode.slice(0, 8000));
  const [showCode, setShowCode] = React.useState(Boolean(initialCode));
  const [codeLanguage, setCodeLanguage] = React.useState<"html" | "css" | "javascript">(initialCodeLanguage);
  const [lessonId, setLessonId] = React.useState<string | null>(fixedLesson?.id ?? defaultLessonId);
  const [language, setLanguage] = React.useState<"id" | "en">(defaultLanguage);
  const [used, setUsed] = React.useState(Math.min(initialUsed, dailyLimit));
  const [streaming, setStreaming] = React.useState(false);
  const [error, setError] = React.useState<TutorError | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [loadingConversation, setLoadingConversation] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(!embedded);
  const [conversationSearch, setConversationSearch] = React.useState("");
  const [historySearching, setHistorySearching] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TutorConversation | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [forceScrollVersion, setForceScrollVersion] = React.useState(0);

  const abortRef = React.useRef<AbortController | null>(null);
  const requestGenerationRef = React.useRef(0);
  const conversationLoadGenerationRef = React.useRef(0);
  const conversationIdRef = React.useRef<string | null>(null);
  const lastUserMessageIdRef = React.useRef<string | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const lastPayloadRef = React.useRef<TutorPayload | null>(null);
  const lastInitialCodeRef = React.useRef(initialCode);

  const remaining = Math.max(0, dailyLimit - used);
  const visibleConversations = conversationSearch.trim()
    ? searchResults ?? []
    : allConversations;

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  React.useEffect(() => {
    const codeChanged = initialCode !== lastInitialCodeRef.current;
    if (!codeChanged) return;
    lastInitialCodeRef.current = initialCode;
    setCode(initialCode.slice(0, 8000));
    setShowCode(Boolean(initialCode));
  }, [initialCode]);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/ai/usage", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data: { used?: number } | null) => {
        if (alive && typeof data?.used === "number") setUsed(Math.min(data.used, dailyLimit));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [dailyLimit]);

  React.useEffect(() => {
    const query = conversationSearch.trim();
    if (!query) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setHistorySearching(true);
      setHistoryError(null);
      try {
        const response = await fetch("/api/ai/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify({ query }),
        });
        const payload = await response.json().catch(() => null);
        if (response.status === 401) {
          router.push(`/login?next=${encodeURIComponent(pathname || "/ai-tutor")}`);
          return;
        }
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Pencarian riwayat gagal.");
        }
        const results = Array.isArray(payload?.conversations)
          ? (payload.conversations as TutorConversation[])
          : [];
        setSearchResults(results);
      } catch (searchError) {
        if (controller.signal.aborted) return;
        setHistoryError(searchError instanceof Error ? searchError.message : "Pencarian riwayat gagal.");
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setHistorySearching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [conversationSearch, pathname, router]);

  React.useEffect(() => () => {
    requestGenerationRef.current += 1;
    conversationLoadGenerationRef.current += 1;
    abortRef.current?.abort();
  }, []);

  function setSearch(value: string) {
    const next = value.slice(0, 80);
    setConversationSearch(next);
    if (!next.trim()) {
      setSearchResults(null);
      setHistoryError(null);
      setHistorySearching(false);
    }
  }

  function updateConversation(conversation: TutorConversation) {
    setAllConversations((current) => {
      const found = current.some((entry) => entry.id === conversation.id);
      const next = found
        ? current.map((entry) => (entry.id === conversation.id ? conversation : entry))
        : [conversation, ...current];
      return next.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    });
    setSearchResults((current) => {
      if (!current) return current;
      const found = current.some((entry) => entry.id === conversation.id);
      if (found) {
        return current
          .map((entry) => (entry.id === conversation.id ? conversation : entry))
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      }
      const search = conversationSearch.trim().toLocaleLowerCase();
      if (search && !conversation.title.toLocaleLowerCase().includes(search)) return current;
      return [conversation, ...current].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    });
  }

  function removeConversation(id: string) {
    setAllConversations((current) => current.filter((entry) => entry.id !== id));
    setSearchResults((current) => current?.filter((entry) => entry.id !== id) ?? null);
  }

  function beginLoginRedirect() {
    router.push(`/login?next=${encodeURIComponent(pathname || "/ai-tutor")}`);
  }

  async function loadConversation(id: string) {
    if (streaming || loadingConversation) return;
    const loadGeneration = conversationLoadGenerationRef.current + 1;
    conversationLoadGenerationRef.current = loadGeneration;
    setLoadingConversation(true);
    setError(null);
    setFormError(null);
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (conversationLoadGenerationRef.current !== loadGeneration) return;
      if (response.status === 401) {
        beginLoginRedirect();
        return;
      }
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Percakapan belum bisa dimuat.");
      }

      const conversation = payload?.conversation as TutorConversation | undefined;
      if (!conversation?.id || !Array.isArray(payload?.messages)) {
        throw new Error("Data percakapan belum lengkap.");
      }
      conversationIdRef.current = conversation.id;
      setActiveId(conversation.id);
      updateConversation(conversation);
      setMessages(
        (payload.messages as TutorMessage[]).map((entry) => ({
          id: entry.id,
          role: entry.role,
          content: entry.content,
          created_at: entry.created_at,
        })),
      );
      setLessonId(conversation.lesson_id ?? (fixedLesson?.id ?? null));
      lastPayloadRef.current = null;
      lastUserMessageIdRef.current = null;
      setForceScrollVersion((version) => version + 1);
      setHistoryOpen(false);
    } catch (loadError) {
      if (conversationLoadGenerationRef.current === loadGeneration) {
        toast.error(loadError instanceof Error ? loadError.message : "Percakapan belum bisa dimuat.");
      }
    } finally {
      if (conversationLoadGenerationRef.current === loadGeneration) setLoadingConversation(false);
    }
  }

  async function renameConversation(id: string, title: string): Promise<boolean> {
    if (streaming && activeId === id) {
      toast.error("Hentikan respons sebelum mengubah percakapan yang sedang aktif.");
      return false;
    }
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ title: title.trim().slice(0, 80) }),
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 401) {
        beginLoginRedirect();
        return false;
      }
      if (!response.ok || !payload?.conversation) {
        throw new Error(payload?.error?.message ?? "Judul percakapan belum bisa disimpan.");
      }
      updateConversation(payload.conversation as TutorConversation);
      toast.success("Judul percakapan diperbarui");
      return true;
    } catch (renameError) {
      toast.error(renameError instanceof Error ? renameError.message : "Gagal mengubah nama percakapan.");
      return false;
    }
  }

  async function confirmDeleteConversation() {
    if (!deleteTarget || deleting) return;
    if (streaming && activeId === deleteTarget.id) {
      toast.error("Hentikan respons sebelum menghapus percakapan yang sedang aktif.");
      setDeleteTarget(null);
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch(`/api/ai/conversations/${deleteTarget.id}`, {
        method: "DELETE",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);
      if (response.status === 401) {
        beginLoginRedirect();
        return;
      }
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Percakapan belum bisa dihapus.");
      }
      const deletedId = deleteTarget.id;
      removeConversation(deletedId);
      setDeleteTarget(null);
      toast.success("Percakapan dihapus");
      if (activeId === deletedId) startNewChat();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Gagal menghapus percakapan.");
    } finally {
      setDeleting(false);
    }
  }

  function startNewChat() {
    requestGenerationRef.current += 1;
    conversationLoadGenerationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    conversationIdRef.current = null;
    lastPayloadRef.current = null;
    lastUserMessageIdRef.current = null;
    setActiveId(null);
    setMessages([]);
    setMode("free_chat");
    setError(null);
    setFormError(null);
    setStreaming(false);
    setLoadingConversation(false);
    setHistoryOpen(false);
    setConversationSearch("");
    setSearchResults(null);
    setHistoryError(null);
    setHistorySearching(false);
    setCode("");
    setShowCode(false);
    setCodeLanguage("html");
    setLessonId(fixedLesson?.id ?? defaultLessonId);
    setForceScrollVersion((version) => version + 1);
    inputRef.current?.focus();
  }

  function chooseMode(next: AiAction) {
    setMode(next);
    setFormError(null);
    if (codeActions.has(next)) setShowCode(true);
    inputRef.current?.focus();
  }

  function handleRemaining(value: number | undefined) {
    if (typeof value === "number" && Number.isFinite(value)) {
      setUsed(Math.min(dailyLimit, Math.max(0, dailyLimit - value)));
    }
  }

  function restoreDraft(draft: string) {
    if (!draft.trim()) return;
    setMessage((current) => (current.trim().length === 0 ? draft : current));
  }

  async function send(retry = false) {
    if (streaming || !aiConfigured) return;

    const previousDraft = message;
    let payload: TutorPayload;
    if (retry && lastPayloadRef.current) {
      payload = lastPayloadRef.current;
    } else {
      const rawMessage = message.trim();
      const action = mode;
      const currentLessonId = lessonId;
      if (codeActions.has(action) && !code.trim()) {
        setFormError("Lampirkan kode terlebih dahulu untuk mode ini.");
        setShowCode(true);
        return;
      }
      if (action === "explain_lesson" && !currentLessonId) {
        setFormError("Pilih atau tambahkan konteks lesson terlebih dahulu.");
        return;
      }
      if (action === "free_chat" && !rawMessage) {
        setFormError("Tulis pertanyaan terlebih dahulu.");
        inputRef.current?.focus();
        return;
      }
      if (action === "hint" && !rawMessage && !code.trim()) {
        setFormError("Tulis latihan yang ingin diberi hint atau lampirkan kodenya.");
        inputRef.current?.focus();
        return;
      }
      if (remaining <= 0) {
        setFormError("Kuota AI harian sudah habis. Coba lagi besok.");
        return;
      }

      let effectiveMessage = rawMessage;
      if (action === "explain_lesson" && !effectiveMessage) {
        effectiveMessage = language === "en"
          ? "Explain the main idea of this lesson in simple terms, with a small example."
          : "Jelaskan inti lesson ini dengan bahasa sederhana dan satu contoh kecil.";
      } else if (action === "practice_suggestions" && !effectiveMessage) {
        effectiveMessage = language === "en"
          ? "Suggest three small practice tasks for my current level."
          : "Berikan tiga saran latihan kecil yang sesuai dengan level saya.";
      }

      payload = {
        action,
        message: effectiveMessage,
        code: code.trim(),
        codeLanguage,
        lessonId: currentLessonId,
        language,
      };
    }

    setFormError(null);
    setError(null);
    lastPayloadRef.current = payload;

    const lessonTitle = fixedLesson?.title ?? lessonOptions.find((entry) => entry.id === payload.lessonId)?.title;
    const userContent = [
      payload.message,
      payload.code ? `\`\`\`${payload.codeLanguage}\n${payload.code}\n\`\`\`` : "",
    ]
      .filter(Boolean)
      .join("\n\n") || (payload.action === "explain_lesson" ? `Jelaskan lesson ${lessonTitle ?? "ini"}.` : "Permintaan bantuan AI");

    const userId = retry ? lastUserMessageIdRef.current ?? newId() : newId();
    if (!retry) lastUserMessageIdRef.current = userId;
    const assistantId = newId();
    const conversationAtStart = activeId;
    const requestId = requestGenerationRef.current + 1;
    requestGenerationRef.current = requestId;
    const controller = new AbortController();
    abortRef.current = controller;
    let streamedContent = "";
    let streamFailed = false;
    let streamDone = false;
    const draftToRestore = previousDraft;

    function discardUnsavedNewConversation() {
      if (conversationAtStart || !conversationIdRef.current) return;
      const unsavedId = conversationIdRef.current;
      removeConversation(unsavedId);
      setActiveId(null);
      conversationIdRef.current = null;
    }

    if (!retry) {
      setMessages((current) => [
        ...current,
        {
          id: userId,
          role: "user",
          content: userContent,
          created_at: new Date().toISOString(),
        },
        {
          id: assistantId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
          streaming: true,
        },
      ]);
      setMessage("");
    } else {
      if (message.trim() === payload.message.trim()) setMessage("");
      setMessages((current) => [
        ...current
          .filter((entry) => !entry.streaming)
          .map((entry) => (entry.failed ? { ...entry, failed: false } : entry)),
        {
          id: assistantId,
          role: "assistant",
          content: "",
          created_at: new Date().toISOString(),
          streaming: true,
        },
      ]);
    }
    setForceScrollVersion((version) => version + 1);
    setStreaming(true);

    function restoreFailedTurn() {
      restoreDraft(draftToRestore);
      setMessages((current) =>
        current
          .filter((entry) => entry.id !== assistantId || entry.content.length > 0)
          .map((entry) => {
            if (entry.id === userId) return { ...entry, failed: true };
            if (entry.id === assistantId) return { ...entry, streaming: false };
            return entry;
          }),
      );
    }

    function handleEvent(eventText: string) {
      if (requestGenerationRef.current !== requestId) return;
      const dataLines = eventText
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""));
      if (dataLines.length === 0) return;

      let parsed: StreamEvent;
      try {
        parsed = JSON.parse(dataLines.join("\n")) as StreamEvent;
      } catch {
        return;
      }

      if (parsed.type === "start") {
        handleRemaining(parsed.remaining);
        if (parsed.conversationId) {
          conversationIdRef.current = parsed.conversationId;
          setActiveId(parsed.conversationId);
          const title = parsed.title || truncate(payload.message || "Percakapan baru", 60);
          updateConversation({
            id: parsed.conversationId,
            title,
            updated_at: new Date().toISOString(),
            lesson_id: payload.lessonId,
          });
        }
      }

      if (parsed.type === "delta" && typeof parsed.text === "string") {
        streamedContent += parsed.text;
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId ? { ...entry, content: streamedContent } : entry,
          ),
        );
      }

      if (parsed.type === "done") {
        streamDone = true;
        handleRemaining(parsed.remaining);
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId
              ? { ...entry, streaming: false }
              : entry.id === userId
                ? { ...entry, failed: false }
                : entry,
          ),
        );
        const completedId = parsed.conversationId ?? conversationIdRef.current ?? conversationAtStart;
        if (parsed.saved === false) {
          discardUnsavedNewConversation();
          if (streamedContent.length > 0) {
            setError({
              code: "persistence_failed",
              message: "Jawaban selesai, tetapi riwayat percakapan tidak tersimpan. Salin jawaban sebelum meninggalkan halaman.",
              retryable: false,
            });
          }
        } else if (completedId) {
          const current = allConversations.find((entry) => entry.id === completedId);
          if (current) updateConversation({ ...current, updated_at: new Date().toISOString() });
        }
      }

      if (parsed.type === "error") {
        streamFailed = true;
        handleRemaining(parsed.remaining);
        if (parsed.code === "quota_exceeded") setUsed(dailyLimit);
        if (parsed.saved === false) discardUnsavedNewConversation();
        if (streamedContent.length === 0) {
          restoreFailedTurn();
        } else {
          setMessages((current) =>
            current.map((entry) =>
              entry.id === assistantId
                ? { ...entry, streaming: false }
                : entry.id === userId
                  ? { ...entry, failed: false }
                  : entry,
            ),
          );
        }
        setError({
          code: parsed.code ?? "stream_error",
          message: `${parsed.message ?? "Jawaban AI terputus. Coba lagi."}${
            parsed.saved === false && streamedContent.length > 0
              ? " Respons parsial ini tidak tersimpan di riwayat."
              : ""
          }`,
          retryable: parsed.retryable ?? true,
        });
      }
    }

    try {
      const endpoint = actionEndpoints[payload.action] ?? "/api/ai/chat";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        cache: "no-store",
        body: JSON.stringify({
          action: payload.action,
          message: payload.message || undefined,
          code: payload.code || undefined,
          codeLanguage: payload.codeLanguage,
          lessonId: payload.lessonId || undefined,
          conversationId: conversationAtStart || undefined,
          language: payload.language,
        }),
      });
      if (requestGenerationRef.current !== requestId) return;

      const remainingHeader = response.headers.get("x-ai-remaining");
      if (remainingHeader !== null && remainingHeader !== "") {
        const value = Number(remainingHeader);
        if (Number.isFinite(value)) handleRemaining(value);
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        if (requestGenerationRef.current !== requestId) return;
        const apiError = body?.error as { code?: string; message?: string } | undefined;
        if (response.status === 401) {
          restoreFailedTurn();
          beginLoginRedirect();
          return;
        }
        restoreFailedTurn();
        const retryable =
          !nonRetryableApiErrors.has(apiError?.code ?? "") &&
          (response.status >= 500 || response.status === 429);
        setError({
          code: apiError?.code ?? "request_failed",
          message: apiError?.message ?? "Permintaan AI belum berhasil. Coba lagi.",
          retryable,
        });
        if (apiError?.code === "quota_exceeded") setUsed(dailyLimit);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Streaming tidak didukung browser ini.");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) handleEvent(event);
      }

      buffer += decoder.decode();
      const finalEvent = buffer.trim();
      if (finalEvent) handleEvent(finalEvent);
      if (requestGenerationRef.current !== requestId) return;

      if (!streamDone && !streamFailed) {
        if (streamedContent.length === 0) {
          restoreFailedTurn();
          setError({
            code: "empty_response",
            message: "AI tidak mengembalikan teks. Coba kirim ulang pertanyaanmu.",
            retryable: true,
          });
        } else {
          setMessages((current) =>
            current.map((entry) =>
              entry.id === assistantId ? { ...entry, streaming: false } : entry,
            ),
          );
          setError({
            code: "stream_interrupted",
            message: "Jawaban terputus sebelum selesai. Kamu bisa mencoba lagi.",
            retryable: true,
          });
        }
      } else if (streamDone && streamedContent.length === 0) {
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId
              ? { ...entry, streaming: false, content: "AI tidak mengembalikan teks." }
              : entry.id === userId
                ? { ...entry, failed: true }
                : entry,
          ),
        );
        setError({
          code: "empty_response",
          message: "AI tidak mengembalikan teks. Coba kirim ulang pertanyaanmu.",
          retryable: true,
        });
      }
    } catch (streamError) {
      if (requestGenerationRef.current !== requestId) return;
      const aborted = isAbortError(streamError);
      if (streamedContent.length === 0) {
        restoreFailedTurn();
      } else {
        setMessages((current) =>
          current.map((entry) =>
            entry.id === assistantId
              ? { ...entry, streaming: false, stopped: aborted }
              : entry.id === userId
                ? { ...entry, failed: false }
                : entry,
          ),
        );
      }

      if (aborted) {
        if (!conversationAtStart && streamedContent.length === 0 && conversationIdRef.current) {
          removeConversation(conversationIdRef.current);
          setActiveId(null);
          conversationIdRef.current = null;
        }
      } else if (!streamFailed) {
        setError({
          code: "network_error",
          message: "Koneksi ke AI terputus. Periksa jaringan lalu coba lagi.",
          retryable: true,
        });
      }
    } finally {
      if (requestGenerationRef.current === requestId) {
        setStreaming(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    }
  }

  async function copyMessage(entry: TutorMessage) {
    try {
      await navigator.clipboard.writeText(entry.content);
      setCopiedId(entry.id);
      window.setTimeout(() => setCopiedId((current) => (current === entry.id ? null : current)), 1500);
    } catch {
      toast.error("Clipboard tidak tersedia di browser ini.");
    }
  }

  function onNewChat() {
    startNewChat();
    if (embedded) inputRef.current?.focus();
  }

  const sidebarProps = {
    conversations: visibleConversations,
    activeId,
    search: conversationSearch,
    loading: historySearching,
    error: historyError,
    onSearch: setSearch,
    onSelect: (id: string) => {
      if (streaming) {
        toast.error("Hentikan respons sebelum beralih ke percakapan lain.");
        return;
      }
      void loadConversation(id);
    },
    onNew: onNewChat,
    onRename: renameConversation,
    onDelete: (conversation: TutorConversation) => {
      if (streaming && activeId === conversation.id) {
        toast.error("Hentikan respons sebelum menghapus percakapan yang sedang aktif.");
        return;
      }
      setDeleteTarget(conversation);
    },
  };

  return (
    <div className={cn("flex min-h-0 flex-col bg-canvas text-ink", embedded ? "h-full" : "h-full")}>
      <header className="flex min-h-[3.75rem] shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {!embedded ? (
            <>
              <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label={sidebarOpen ? "Sembunyikan riwayat" : "Tampilkan riwayat"}
                aria-expanded={sidebarOpen}
                className="hidden size-8 shrink-0 items-center justify-center rounded-[5px] text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text lg:inline-flex"
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" aria-hidden="true" /> : <PanelLeftOpen className="size-4" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                aria-label="Buka riwayat percakapan"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-[5px] text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text lg:hidden"
              >
                <History className="size-4" aria-hidden="true" />
              </button>
            </>
          ) : null}
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-accent-soft">
            <Sparkles className="size-4 text-accent-text" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">LearnCode AI</p>
            <p className="hidden truncate text-[10px] text-muted sm:block">Asisten belajar coding</p>
          </div>
          <span
            className={cn(
              "ml-1 hidden shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] sm:inline-flex",
              aiConfigured ? "border-ok/25 bg-ok-soft text-ok" : "border-highlight/30 bg-highlight-soft text-highlight",
            )}
            role="status"
            title={aiConfigured ? `Groq · ${modelLabel}` : "Layanan AI tidak tersedia"}
          >
            <span className={cn("size-1.5 rounded-full", aiConfigured ? "bg-ok" : "bg-highlight")} aria-hidden="true" />
            {aiConfigured ? `Groq · ${modelLabel}` : "Tidak tersedia"}
          </span>
          <span
            className={cn(
              "ml-1 size-2 shrink-0 rounded-full sm:hidden",
              aiConfigured ? "bg-ok" : "bg-highlight",
            )}
            role="status"
            aria-label={aiConfigured ? `Groq aktif · ${modelLabel}` : "Layanan AI tidak tersedia"}
            title={aiConfigured ? `Groq · ${modelLabel}` : "Layanan AI tidak tersedia"}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden font-mono text-[10px] text-muted sm:inline" aria-label={`${remaining} dari ${dailyLimit} pesan AI tersisa hari ini`}>
            {remaining}/{dailyLimit} pesan
          </span>
          <button
            type="button"
            onClick={onNewChat}
            aria-label="Mulai percakapan baru"
            title="Percakapan baru"
            className="inline-flex h-8 items-center gap-1.5 rounded-[5px] px-2 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Baru</span>
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup LearnCode AI"
              className="inline-flex size-8 items-center justify-center rounded-[5px] text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {!embedded && sidebarOpen ? (
          <aside className="hidden w-[17.5rem] shrink-0 border-r border-line lg:flex" aria-label="Riwayat percakapan">
            <TutorConversationSidebar {...sidebarProps} idPrefix="desktop" />
          </aside>
        ) : null}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TutorModeToolbar
            mode={mode}
            lessonId={lessonId}
            fixedLesson={fixedLesson}
            lessonOptions={lessonOptions}
            language={language}
            disabled={streaming}
            onModeChange={chooseMode}
            onLessonChange={(id) => {
              setLessonId(id);
              setFormError(null);
            }}
            onLanguageChange={setLanguage}
          />
          <TutorMessageList
            messages={messages}
            error={error}
            loading={loadingConversation}
            copiedId={copiedId}
            forceScrollVersion={forceScrollVersion}
            onCopy={copyMessage}
            onRetry={() => void send(true)}
            onDismissError={() => setError(null)}
            onSuggestion={(value) => {
              setMode("free_chat");
              setMessage(value);
              inputRef.current?.focus();
            }}
          />
          <TutorComposer
            message={message}
            onMessageChange={(value) => {
              setMessage(value);
              if (formError) setFormError(null);
            }}
            onSubmit={() => void send()}
            mode={mode}
            streaming={streaming}
            onStop={() => abortRef.current?.abort()}
            aiConfigured={aiConfigured}
            remaining={remaining}
            dailyLimit={dailyLimit}
            showCode={showCode}
            onToggleCode={() => setShowCode((current) => !current)}
            code={code}
            onCodeChange={(value) => {
              setCode(value);
              if (formError) setFormError(null);
            }}
            codeLanguage={codeLanguage}
            onCodeLanguageChange={setCodeLanguage}
            inputRef={inputRef}
            formError={formError}
          />
        </main>
      </div>

      {!embedded ? (
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent
            className="inset-y-0 left-0 h-dvh w-[min(88vw,22rem)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-l-0 p-0 sm:w-[22rem]"
            hideClose
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Riwayat percakapan</DialogTitle>
              <DialogDescription>Cari, buka, ubah nama, atau hapus percakapan yang tersimpan.</DialogDescription>
            </DialogHeader>
            <TutorConversationSidebar {...sidebarProps} idPrefix="mobile" />
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus percakapan?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title ?? "Percakapan"}” dan seluruh pesannya akan dihapus permanen dari akunmu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Batal
            </Button>
            <Button type="button" variant="danger" loading={deleting} onClick={() => void confirmDeleteConversation()}>
              Hapus percakapan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

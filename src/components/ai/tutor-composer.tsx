"use client";

import * as React from "react";
import { BookOpen, Check, Code2, Paperclip, Send, Square, Trash2, X } from "lucide-react";

import type { TutorLessonOption } from "@/components/ai/tutor-chat-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/input";
import { TUTOR_LANGUAGES, TUTOR_MODE_MAP, getQuotaStatus } from "@/lib/ai/tutor-ui";
import { cn } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";

export type TutorComposerHandle = {
  getDraft: () => { message: string; code: string };
  setMessage: (value: string) => void;
  setCode: (value: string) => void;
  restoreMessageIfEmpty: (value: string) => void;
  clearAll: () => void;
  focus: () => void;
};

export const TutorComposer = React.memo(function TutorComposer({
  message,
  onMessageChange,
  onSubmit,
  onSubmitDraft,
  mode,
  streaming,
  onStop,
  aiConfigured,
  used,
  dailyLimit,
  showCode,
  onToggleCode,
  code,
  initialCode = "",
  onCodeChange,
  codeLanguage,
  onCodeLanguageChange,
  lessonId = null,
  fixedLesson = null,
  lessonOptions = [],
  onLessonChange,
  language = "id",
  onLanguageChange,
  inputRef: externalInputRef,
  composerRef,
  formError,
  onClearFormError,
}: {
  message?: string;
  onMessageChange?: (value: string) => void;
  onSubmit?: () => void;
  onSubmitDraft?: (draft: { message: string; code: string }) => void;
  mode: AiAction;
  streaming: boolean;
  onStop: () => void;
  aiConfigured: boolean;
  used: number;
  dailyLimit: number;
  showCode: boolean;
  onToggleCode: () => void;
  code?: string;
  initialCode?: string;
  onCodeChange?: (value: string) => void;
  codeLanguage: "html" | "css" | "javascript";
  onCodeLanguageChange: (value: "html" | "css" | "javascript") => void;
  lessonId?: string | null;
  fixedLesson?: { id: string; title: string } | null;
  lessonOptions?: TutorLessonOption[];
  onLessonChange?: (lessonId: string | null) => void;
  language?: "id" | "en";
  onLanguageChange?: (language: "id" | "en") => void;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  composerRef?: React.RefObject<TutorComposerHandle | null>;
  formError: string | null;
  onClearFormError?: () => void;
}) {
  const internalInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const resolvedInputRef = externalInputRef ?? internalInputRef;

  const [internalMessage, setInternalMessage] = React.useState("");
  const [internalCode, setInternalCode] = React.useState(() => initialCode.slice(0, 8000));
  const [inputFocused, setInputFocused] = React.useState(false);
  const lastInitialCodeRef = React.useRef(initialCode);
  const languageTooltipId = React.useId();

  React.useEffect(() => {
    if (initialCode !== lastInitialCodeRef.current) {
      lastInitialCodeRef.current = initialCode;
      setInternalCode(initialCode.slice(0, 8000));
    }
  }, [initialCode]);

  const effectiveMessage = message !== undefined ? message : internalMessage;
  const effectiveCode = code !== undefined ? code : internalCode;

  const draftRef = React.useRef({ message: effectiveMessage, code: effectiveCode });

  React.useEffect(() => {
    draftRef.current = { message: effectiveMessage, code: effectiveCode };
  }, [effectiveMessage, effectiveCode]);

  const setDraftMessage = React.useCallback(
    (next: string) => {
      const clamped = next.slice(0, 4000);
      draftRef.current = { ...draftRef.current, message: clamped };
      if (message === undefined) setInternalMessage(clamped);
      onMessageChange?.(clamped);
    },
    [message, onMessageChange],
  );

  const setDraftCode = React.useCallback(
    (next: string) => {
      const clamped = next.slice(0, 8000);
      draftRef.current = { ...draftRef.current, code: clamped };
      if (code === undefined) setInternalCode(clamped);
      onCodeChange?.(clamped);
    },
    [code, onCodeChange],
  );

  React.useImperativeHandle(
    composerRef,
    () => ({
      getDraft: () => draftRef.current,
      setMessage: setDraftMessage,
      setCode: setDraftCode,
      restoreMessageIfEmpty: (value: string) => {
        if (!value.trim()) return;
        if (message === undefined) {
          setInternalMessage((current) =>
            current.trim().length === 0 ? value.slice(0, 4000) : current,
          );
        } else if (message.trim().length === 0) {
          onMessageChange?.(value.slice(0, 4000));
        }
      },
      clearAll: () => {
        if (message === undefined) setInternalMessage("");
        onMessageChange?.("");
        if (code === undefined) setInternalCode("");
        onCodeChange?.("");
      },
      focus: () => resolvedInputRef.current?.focus(),
    }),
    [code, message, onCodeChange, onMessageChange, resolvedInputRef, setDraftCode, setDraftMessage],
  );

  React.useLayoutEffect(() => {
    const node = resolvedInputRef.current;
    if (!node) return;
    node.style.height = "0px";
    const maxHeight = 148; // ~6 rows
    const nextHeight = Math.min(Math.max(node.scrollHeight, 40), maxHeight);
    node.style.height = `${nextHeight}px`;
    node.style.overflowY = node.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [resolvedInputRef, effectiveMessage]);

  const quota = getQuotaStatus(used, dailyLimit);
  const inputLocked = !aiConfigured || quota.level === "exhausted";
  const hasMessageText = effectiveMessage.trim().length > 0;
  const canSubmit = !inputLocked && !streaming && hasMessageText;

  const activeFixedLesson = fixedLesson && lessonId === fixedLesson.id ? fixedLesson : null;
  const selectedLesson = React.useMemo(
    () => lessonOptions.find((lesson) => lesson.id === lessonId) ?? null,
    [lessonOptions, lessonId],
  );
  const needsLessonNotice = mode === "explain_lesson" && !lessonId;
  const placeholder = TUTOR_MODE_MAP[mode]?.placeholder ?? TUTOR_MODE_MAP.free_chat.placeholder;

  function submitCurrentDraft() {
    if (!canSubmit) return;
    if (onSubmitDraft) {
      onSubmitDraft(draftRef.current);
      return;
    }
    onSubmit?.();
  }

  return (
    <div className="shrink-0 border-t border-line bg-surface px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pt-2.5">
      <div className="mx-auto max-w-3xl">
        {quota.level === "exhausted" ? (
          <p
            className="mb-2 rounded-[6px] border border-danger/30 bg-danger-soft px-3 py-1.5 text-xs leading-relaxed text-ink"
            role="status"
          >
            {quota.warningText}
          </p>
        ) : quota.level === "warning" && quota.warningText ? (
          <p
            className="mb-2 rounded-[6px] border border-highlight/30 bg-highlight-soft px-3 py-1.5 text-xs leading-relaxed text-ink"
            role="status"
          >
            {quota.warningText}
          </p>
        ) : null}

        {!aiConfigured ? (
          <p
            className="mb-2 rounded-[6px] border border-highlight/30 bg-highlight-soft px-3 py-1.5 text-xs leading-relaxed text-ink"
            role="status"
          >
            Layanan LearnCode AI sedang tidak tersedia. Kamu tetap dapat membuka riwayat percakapan.
          </p>
        ) : null}

        {formError ? (
          <p role="alert" className="mb-1.5 text-xs font-medium text-danger">
            {formError}
          </p>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitCurrentDraft();
          }}
          className={cn(
            "rounded-[10px] border bg-canvas p-2 shadow-[0_2px_12px_rgb(25_24_20/0.04)] transition-colors",
            inputLocked
              ? "border-line bg-surface-2/60"
              : "border-line-strong focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25",
          )}
        >
          {showCode ? (
            <div className="mb-2 rounded-[7px] border border-line bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-1.5">
                <label htmlFor="ai-code" className="text-xs font-medium text-ink-soft">
                  Lampiran kode
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={codeLanguage}
                    onChange={(event) =>
                      onCodeLanguageChange(event.target.value as "html" | "css" | "javascript")
                    }
                    disabled={inputLocked}
                    aria-label="Bahasa kode lampiran"
                    className="h-7 rounded-[4px] border border-line bg-canvas px-2 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                  >
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftCode("");
                      if (formError) onClearFormError?.();
                    }}
                    disabled={!effectiveCode || inputLocked}
                    title="Bersihkan kode lampiran"
                    aria-label="Hapus kode lampiran"
                    className="inline-flex size-8 items-center justify-center rounded-[4px] text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <Textarea
                id="ai-code"
                value={effectiveCode}
                onChange={(event) => {
                  setDraftCode(event.target.value);
                  if (formError) onClearFormError?.();
                }}
                disabled={inputLocked}
                placeholder="Tempel kode HTML, CSS, atau JavaScript di sini…"
                maxLength={8000}
                rows={4}
                className="min-h-24 resize-y border-0 bg-transparent px-3 py-2 font-mono text-[13px] leading-relaxed placeholder:text-muted focus-visible:ring-0"
                spellCheck={false}
              />
              <p className="border-t border-line px-3 py-1 text-right font-mono text-xs text-muted tabular-nums">
                {effectiveCode.length}/8000
              </p>
            </div>
          ) : null}

          <label htmlFor="ai-message" className="sr-only">
            Pesan untuk LearnCode AI
          </label>
          <Textarea
            ref={resolvedInputRef}
            id="ai-message"
            value={effectiveMessage}
            disabled={inputLocked}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onChange={(event) => {
              setDraftMessage(event.target.value);
              if (formError) onClearFormError?.();
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                if (canSubmit) submitCurrentDraft();
              }
            }}
            placeholder={
              quota.level === "exhausted"
                ? "Kuota harian habis — coba lagi besok."
                : placeholder
            }
            maxLength={4000}
            rows={1}
            className="min-h-10 max-h-[148px] resize-none border-0 bg-transparent px-1.5 py-1.5 text-base leading-relaxed shadow-none placeholder:text-muted focus-visible:ring-0 sm:text-[15px]"
          />

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleCode}
                disabled={inputLocked}
                aria-expanded={showCode}
                aria-controls={showCode ? "ai-code" : undefined}
                title={showCode ? "Tutup lampiran kode" : "Lampirkan kode"}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-[6px] border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none sm:px-2.5",
                  showCode || effectiveCode
                    ? "border-line-strong bg-surface-2 text-ink"
                    : "border-line bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink",
                )}
              >
                {showCode ? (
                  <Code2 className="size-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Paperclip className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="sm:hidden">
                  {effectiveCode ? `Kode (${effectiveCode.length})` : "Kode"}
                </span>
                <span className="hidden sm:inline">
                  {effectiveCode
                    ? `Kode (${effectiveCode.length})`
                    : showCode
                      ? "Tutup kode"
                      : "Lampirkan kode"}
                </span>
              </button>

              {inputFocused ? (
                <span className="hidden truncate text-xs text-muted md:inline">
                  Enter kirim · Shift+Enter baris baru
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {activeFixedLesson ? (
                <span className="inline-flex h-8 max-w-[11rem] items-center gap-1 rounded-[6px] border border-line bg-surface px-2 text-xs text-ink-soft">
                  <BookOpen className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                  <span className="truncate">{activeFixedLesson.title}</span>
                  {onLessonChange ? (
                    <button
                      type="button"
                      onClick={() => onLessonChange(null)}
                      aria-label="Hapus konteks lesson"
                      disabled={streaming}
                      className="rounded p-0.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              ) : fixedLesson && onLessonChange ? (
                <button
                  type="button"
                  onClick={() => onLessonChange(fixedLesson.id)}
                  disabled={streaming || inputLocked}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-dashed border-line-strong bg-surface px-2 text-xs font-medium text-ink-soft hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                >
                  <BookOpen className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                  <span>Lesson</span>
                </button>
              ) : onLessonChange ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={streaming || inputLocked || lessonOptions.length === 0}
                      aria-label={
                        selectedLesson
                          ? `Konteks lesson: ${selectedLesson.title}`
                          : "Konteks lesson: Tanpa lesson"
                      }
                      title={
                        selectedLesson
                          ? `Lesson: ${selectedLesson.courseTitle} — ${selectedLesson.title}`
                          : "Konteks lesson: Tanpa lesson"
                      }
                      className={cn(
                        "inline-flex h-8 max-w-[9.5rem] items-center gap-1.5 rounded-[6px] border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none sm:max-w-[12rem] sm:px-2.5",
                        needsLessonNotice
                          ? "border-highlight/65 bg-highlight-soft text-ink"
                          : selectedLesson
                            ? "border-line-strong bg-surface-2 text-ink"
                            : "border-line bg-surface text-ink-soft hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <BookOpen className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                      <span className="truncate">
                        {selectedLesson ? selectedLesson.title : "Lesson"}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="max-h-72 w-72 overflow-y-auto p-1">
                    <DropdownMenuItem
                      onSelect={() => onLessonChange(null)}
                      className={cn(!lessonId ? "bg-surface-2 font-medium text-ink" : undefined)}
                    >
                      <span className="flex-1 truncate">Tanpa lesson</span>
                      {!lessonId ? (
                        <Check className="size-3.5 shrink-0 text-ink" aria-hidden="true" />
                      ) : null}
                    </DropdownMenuItem>
                    {lessonOptions.map((lesson) => {
                      const active = lesson.id === lessonId;
                      return (
                        <DropdownMenuItem
                          key={lesson.id}
                          onSelect={() => onLessonChange(lesson.id)}
                          className={cn(active ? "bg-surface-2 font-medium text-ink" : undefined)}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-ink">{lesson.title}</p>
                            <p className="truncate text-xs text-muted">{lesson.courseTitle}</p>
                          </div>
                          {active ? (
                            <Check className="size-3.5 shrink-0 text-ink" aria-hidden="true" />
                          ) : null}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {onLanguageChange ? (
                <div className="group relative inline-flex">
                  <div
                    role="group"
                    aria-label="Bahasa jawaban AI"
                    aria-describedby={languageTooltipId}
                    className="inline-flex h-8 items-center rounded-[6px] border border-line bg-surface p-0.5"
                  >
                    {TUTOR_LANGUAGES.map((entry) => {
                      const active = language === entry.value;
                      return (
                        <button
                          key={entry.value}
                          type="button"
                          onClick={() => onLanguageChange(entry.value)}
                          aria-pressed={active}
                          aria-label={entry.fullLabel}
                          disabled={streaming || inputLocked}
                          className={cn(
                            "h-6 rounded-[4px] px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none",
                            active
                              ? "bg-surface-3 text-ink font-semibold"
                              : "text-muted hover:text-ink",
                          )}
                        >
                          {entry.label}
                        </button>
                      );
                    })}
                  </div>
                  <span
                    id={languageTooltipId}
                    role="tooltip"
                    className="pointer-events-none invisible absolute bottom-full right-0 z-40 mb-1.5 w-max rounded-[6px] border border-line-strong bg-surface px-2.5 py-1 text-xs text-ink opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                  >
                    Bahasa jawaban AI
                  </span>
                </div>
              ) : null}

              {effectiveMessage.length > 0 ? (
                <span
                  className="hidden font-mono text-xs text-muted tabular-nums sm:inline"
                  aria-label={`${effectiveMessage.length} dari 4000 karakter`}
                >
                  {effectiveMessage.length}/4000
                </span>
              ) : null}

              {streaming ? (
                <Button type="button" size="sm" variant="secondary" className="h-8 px-3" onClick={onStop}>
                  <Square aria-hidden="true" />
                  <span>Hentikan</span>
                </Button>
              ) : (
                <Button type="submit" size="sm" className="h-8 px-3" disabled={!canSubmit}>
                  <Send aria-hidden="true" />
                  <span>Kirim</span>
                </Button>
              )}
            </div>
          </div>
        </form>

        <p className="mt-1 truncate px-1 text-center text-xs leading-normal text-muted sm:text-left">
          AI bisa keliru, periksa kembali jawabannya.
        </p>
      </div>
    </div>
  );
});

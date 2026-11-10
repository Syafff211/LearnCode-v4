"use client";

import * as React from "react";
import { Code2, Paperclip, Send, Square, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";

const placeholders: Record<AiAction, string> = {
  free_chat: "Tulis pertanyaan tentang HTML, CSS, atau JavaScript…",
  explain_code: "Apa yang ingin kamu pahami dari kode ini?",
  debug_code: "Apa yang terjadi dan error apa yang muncul?",
  hint: "Tulis latihan atau bagian yang ingin diberi hint…",
  code_review: "Bagian mana yang paling ingin kamu periksa?",
  explain_lesson: "Bagian lesson mana yang ingin dijelaskan ulang?",
  practice_suggestions: "Fokus latihan apa yang kamu inginkan?",
};

export function TutorComposer({
  message,
  onMessageChange,
  onSubmit,
  mode,
  streaming,
  onStop,
  aiConfigured,
  remaining,
  dailyLimit,
  showCode,
  onToggleCode,
  code,
  onCodeChange,
  codeLanguage,
  onCodeLanguageChange,
  inputRef,
  formError,
}: {
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
  mode: AiAction;
  streaming: boolean;
  onStop: () => void;
  aiConfigured: boolean;
  remaining: number;
  dailyLimit: number;
  showCode: boolean;
  onToggleCode: () => void;
  code: string;
  onCodeChange: (value: string) => void;
  codeLanguage: "html" | "css" | "javascript";
  onCodeLanguageChange: (value: "html" | "css" | "javascript") => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  formError: string | null;
}) {
  React.useLayoutEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.min(Math.max(node.scrollHeight, 48), 200)}px`;
  }, [inputRef, message]);

  const canSubmit = aiConfigured && remaining > 0 && !streaming;

  return (
    <div className="shrink-0 border-t border-line bg-surface px-3 py-2.5 sm:px-4 sm:py-3">
      {remaining <= 0 ? (
        <p className="mb-2 text-xs text-danger" role="status">Kuota harian habis. Kamu bisa menyimpan draf dan mencoba lagi besok.</p>
      ) : null}
      {!aiConfigured ? (
        <p className="mb-2 text-xs text-highlight" role="status">LearnCode AI sedang tidak tersedia.</p>
      ) : null}
      {formError ? <p role="alert" className="mb-2 text-xs text-danger">{formError}</p> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="rounded-[8px] border border-line-strong bg-canvas p-2.5 shadow-[0_2px_12px_rgb(25_24_20/0.04)] focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15"
      >
        {showCode ? (
          <div className="mb-2.5 rounded-[6px] border border-line bg-surface">
            <div className="flex items-center justify-between gap-2 border-b border-line px-2.5 py-1.5">
              <label htmlFor="ai-code" className="text-[10px] font-medium text-muted">Kode yang dilampirkan</label>
              <div className="flex items-center gap-1.5">
                <select
                  value={codeLanguage}
                  onChange={(event) => onCodeLanguageChange(event.target.value as "html" | "css" | "javascript")}
                  aria-label="Bahasa kode"
                  className="h-6 rounded-[3px] border border-line bg-canvas px-1.5 text-[10px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                >
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="javascript">JavaScript</option>
                </select>
                <button
                  type="button"
                  onClick={() => onCodeChange("")}
                  disabled={!code}
                  aria-label="Hapus kode lampiran"
                  className="rounded-[3px] p-1 text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                </button>
              </div>
            </div>
            <Textarea
              id="ai-code"
              value={code}
              onChange={(event) => onCodeChange(event.target.value.slice(0, 8000))}
              placeholder="Tempel kode yang ingin dibahas…"
              maxLength={8000}
              rows={4}
              className="min-h-24 resize-y border-0 bg-transparent font-mono text-xs leading-relaxed focus-visible:ring-0"
              spellCheck={false}
            />
            <p className="border-t border-line px-2.5 py-1 text-right font-mono text-[9px] text-muted">
              {code.length}/8000
            </p>
          </div>
        ) : null}

        <label htmlFor="ai-message" className="sr-only">Pesan untuk LearnCode AI</label>
        <Textarea
          ref={inputRef}
          id="ai-message"
          value={message}
          onChange={(event) => onMessageChange(event.target.value.slice(0, 4000))}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              if (canSubmit) onSubmit();
            }
          }}
          placeholder={placeholders[mode]}
          maxLength={4000}
          rows={1}
          className="min-h-12 max-h-[200px] resize-none border-0 bg-transparent px-1 py-1.5 text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
        />

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={onToggleCode}
              aria-expanded={showCode}
              aria-controls={showCode ? "ai-code" : undefined}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-[4px] px-2 text-[10px] transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
                showCode || code ? "text-accent-text" : "text-muted",
              )}
            >
              {showCode ? <Code2 className="size-3.5" aria-hidden="true" /> : <Paperclip className="size-3.5" aria-hidden="true" />}
              {code ? `Kode · ${code.length}` : showCode ? "Sembunyikan kode" : "Lampirkan kode"}
            </button>
            <span className="hidden truncate text-[10px] text-muted sm:inline">
              Enter kirim · Shift+Enter baris baru
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[9px] text-muted sm:inline" aria-label={`${remaining} dari ${dailyLimit} pesan tersisa`}>
              {remaining}/{dailyLimit}
            </span>
            {streaming ? (
              <Button type="button" size="sm" variant="secondary" onClick={onStop}>
                <Square aria-hidden="true" />
                Hentikan
              </Button>
            ) : null}
            <Button type="submit" size="sm" disabled={!canSubmit}>
              <Send aria-hidden="true" />
              Kirim
            </Button>
          </div>
        </div>
      </form>
      <p className="mt-1.5 px-1 text-center text-[9px] text-muted sm:text-left">
        LearnCode AI dapat keliru. Tinjau saran sebelum menggunakannya; kode tidak dijalankan oleh AI.
      </p>
    </div>
  );
}

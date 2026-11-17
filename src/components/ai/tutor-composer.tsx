"use client";

import * as React from "react";
import { Code2, Paperclip, Send, Square, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { getQuotaStatus } from "@/lib/ai/tutor-ui";
import { cn } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";

const placeholders: Record<AiAction, string> = {
  free_chat: "Tulis pertanyaan tentang HTML, CSS, atau JavaScript…",
  explain_code: "Apa yang ingin kamu pahami dari kode ini?",
  debug_code: "Ceritakan error atau perilaku kode yang tidak sesuai…",
  hint: "Tulis bagian latihan yang membuatmu bingung…",
  code_review: "Bagian mana yang paling ingin kamu periksa?",
  explain_lesson: "Bagian lesson mana yang ingin dijelaskan ulang?",
  practice_suggestions: "Topik atau level latihan apa yang kamu inginkan?",
};

export function TutorComposer({
  message,
  onMessageChange,
  onSubmit,
  mode,
  streaming,
  onStop,
  aiConfigured,
  used,
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
  used: number;
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
    node.style.height = `${Math.min(Math.max(node.scrollHeight, 44), 180)}px`;
  }, [inputRef, message]);

  const quota = getQuotaStatus(used, dailyLimit);
  const canSubmit = aiConfigured && quota.remaining > 0 && !streaming;

  return (
    <div className="shrink-0 border-t border-line bg-surface px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-5 sm:pt-3">
      <div className="mx-auto max-w-[50rem]">
        {quota.level === "exhausted" ? (
          <p
            className="mb-2 rounded-[6px] border border-danger/30 bg-danger-soft px-3 py-2 text-xs leading-relaxed text-ink"
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
            className="mb-2 rounded-[6px] border border-highlight/30 bg-highlight-soft px-3 py-2 text-xs leading-relaxed text-ink"
            role="status"
          >
            Layanan LearnCode AI sedang tidak tersedia. Kamu tetap dapat membuka riwayat percakapan.
          </p>
        ) : null}

        {formError ? (
          <p role="alert" className="mb-2 text-xs font-medium text-danger">
            {formError}
          </p>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="rounded-[10px] border border-line-strong bg-canvas p-2.5 shadow-[0_2px_12px_rgb(25_24_20/0.04)] transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20"
        >
          {showCode ? (
            <div className="mb-2.5 rounded-[7px] border border-line bg-surface">
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
                    aria-label="Bahasa kode lampiran"
                    className="h-7 rounded-[4px] border border-line bg-canvas px-2 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                  >
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onCodeChange("")}
                    disabled={!code}
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
                value={code}
                onChange={(event) => onCodeChange(event.target.value.slice(0, 8000))}
                placeholder="Tempel kode HTML, CSS, atau JavaScript di sini…"
                maxLength={8000}
                rows={4}
                className="min-h-24 resize-y border-0 bg-transparent px-3 py-2 font-mono text-[13px] leading-relaxed focus-visible:ring-0"
                spellCheck={false}
              />
              <p className="border-t border-line px-3 py-1 text-right font-mono text-xs text-muted tabular-nums">
                {code.length}/8000
              </p>
            </div>
          ) : null}

          <label htmlFor="ai-message" className="sr-only">
            Pesan untuk LearnCode AI
          </label>
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
            className="min-h-11 max-h-[180px] resize-none border-0 bg-transparent px-1.5 py-1.5 text-base leading-relaxed shadow-none focus-visible:ring-0 sm:text-[15px]"
          />

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={onToggleCode}
                aria-expanded={showCode}
                aria-controls={showCode ? "ai-code" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-[6px] px-2.5 text-xs font-medium transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
                  showCode || code ? "bg-accent-soft/65 text-accent-text" : "text-muted hover:text-ink",
                )}
              >
                {showCode ? (
                  <Code2 className="size-4" aria-hidden="true" />
                ) : (
                  <Paperclip className="size-4" aria-hidden="true" />
                )}
                <span>
                  {code
                    ? `Kode terlampir (${code.length})`
                    : showCode
                      ? "Tutup lampiran kode"
                      : "Lampirkan kode"}
                </span>
              </button>
              <span className="hidden truncate text-xs text-muted md:inline">
                Enter kirim · Shift+Enter baris baru
              </span>
            </div>

            <div className="flex items-center gap-2">
              {message.length > 0 ? (
                <span
                  className="font-mono text-xs text-muted tabular-nums"
                  aria-label={`${message.length} dari 4000 karakter`}
                >
                  {message.length}/4000
                </span>
              ) : null}
              {streaming ? (
                <Button type="button" size="sm" variant="secondary" className="h-9 px-3" onClick={onStop}>
                  <Square aria-hidden="true" />
                  <span>Hentikan</span>
                </Button>
              ) : (
                <Button type="submit" size="sm" className="h-9 px-3.5" disabled={!canSubmit}>
                  <Send aria-hidden="true" />
                  <span>Kirim</span>
                </Button>
              )}
            </div>
          </div>
        </form>

        <p className="mt-1.5 px-1 text-center text-xs leading-normal text-muted sm:text-left">
          LearnCode AI dapat keliru. Periksa kembali saran sebelum digunakan; AI tidak menjalankan kode.
        </p>
      </div>
    </div>
  );
}

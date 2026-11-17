"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, ArrowUpRight, Check, Copy, RotateCcw, Sparkles } from "lucide-react";

import { LoadingIndicator } from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { TUTOR_QUICK_REPLIES } from "@/lib/ai/tutor-ui";
import { cn } from "@/lib/utils";
import type { TutorError, TutorMessage } from "@/components/ai/tutor-chat-types";

function safeMarkdownUrl(url: string): string {
  const value = url.trim();
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if ((value.startsWith("/") && !value.startsWith("//")) || value.startsWith("#")) return value;
  return "";
}

function textFromNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textFromNode(node.props.children);
  }
  return "";
}

function extractCodeLanguage(node: React.ReactNode): string {
  const arr = Array.isArray(node) ? node : [node];
  for (const child of arr) {
    if (React.isValidElement<{ className?: string }>(child)) {
      const className = child.props.className ?? "";
      const match = /language-([a-z0-9_-]+)/i.exec(className);
      if (match?.[1]) return match[1].toUpperCase();
    }
  }
  return "Kode";
}

function CopyCodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const value = textFromNode(children);
  const langLabel = extractCodeLanguage(children);

  React.useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="my-3 max-w-full overflow-hidden rounded-[8px] border border-line bg-[var(--lc-code-bg)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5">
        <span className="font-mono text-xs uppercase tracking-[0.06em] text-muted">
          {langLabel}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          title={copied ? "Kode tersalin" : "Salin blok kode"}
          aria-label={copied ? "Kode tersalin" : "Salin blok kode"}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-[4px] px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
        >
          {copied ? (
            <Check className="size-3.5 text-ok" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          <span>{copied ? "Tersalin" : "Salin kode"}</span>
        </button>
      </div>
      <pre className="m-0 max-w-full overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="chat-prose min-w-0 max-w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeMarkdownUrl}
        components={{
          a: ({ children, href, ...props }) => {
            const safeHref = href ? safeMarkdownUrl(href) : "";
            if (!safeHref) return <span>{children}</span>;
            return (
              <a href={safeHref} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          img: ({ alt }) => (
            <span className="inline-block rounded border border-line px-2 py-0.5 text-xs text-muted">
              Gambar tidak dimuat{alt ? `: ${alt}` : ""}
            </span>
          ),
          pre: ({ children }) => <CopyCodeBlock>{children}</CopyCodeBlock>,
          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-[6px] border border-line">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function TutorMessageList({
  messages,
  error,
  loading,
  copiedId,
  forceScrollVersion,
  canQuickReply,
  onCopy,
  onRetry,
  onDismissError,
  onQuickReply,
}: {
  messages: TutorMessage[];
  error: TutorError | null;
  loading: boolean;
  copiedId: string | null;
  forceScrollVersion: number;
  canQuickReply: boolean;
  onCopy: (message: TutorMessage) => void;
  onRetry: () => void;
  onDismissError: () => void;
  onQuickReply: (value: string) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const atBottomRef = React.useRef(true);
  const previousForceScrollRef = React.useRef(forceScrollVersion);
  const [showLatest, setShowLatest] = React.useState(false);

  React.useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const forced = previousForceScrollRef.current !== forceScrollVersion;
    previousForceScrollRef.current = forceScrollVersion;
    if (forced) {
      node.scrollTo({ top: node.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      atBottomRef.current = true;
      setShowLatest(false);
    } else if (atBottomRef.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, error, forceScrollVersion]);

  function handleScroll() {
    const node = scrollRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    const atBottom = distanceFromBottom < 120;
    atBottomRef.current = atBottom;
    setShowLatest(!atBottom && messages.length > 0);
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Percakapan dengan LearnCode AI"
        className="h-full min-h-0 overflow-y-auto overscroll-contain px-3 py-5 sm:px-6"
      >
        {loading ? (
          <div className="mx-auto mb-4 flex max-w-[50rem] items-center rounded-[8px] border border-line bg-surface px-4 py-3">
            <LoadingIndicator label="Memuat riwayat percakapan…" />
          </div>
        ) : null}

        {messages.length === 0 && !loading ? (
          <div className="mx-auto flex min-h-full max-w-[40rem] flex-col items-center justify-center py-6 text-center sm:py-10">
            <span className="flex size-11 items-center justify-center rounded-full border border-line bg-surface shadow-xs">
              <Sparkles className="size-5 text-accent-text" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-[1.65rem]">
              Apa yang ingin kamu pelajari hari ini?
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted sm:text-[15px]">
              Tanyakan sesuatu, pahami kode, atau pelajari pemrograman bersama AI Tutor.
            </p>
            <div className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TUTOR_QUICK_REPLIES.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={!canQuickReply}
                  onClick={() => onQuickReply(suggestion)}
                  className="group flex min-h-[44px] items-center justify-between gap-2 rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-left text-sm font-medium text-ink-soft transition-colors hover:border-accent/50 hover:bg-surface-2/60 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none"
                >
                  <span className="leading-snug">{suggestion}</span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-text motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.length > 0 ? (
          <ol className="mx-auto flex max-w-[50rem] flex-col gap-6 pb-16">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isCopied = copiedId === message.id;
              const copyLabel = isCopied
                ? "Pesan tersalin"
                : isUser
                  ? "Salin pesan kamu"
                  : "Salin jawaban AI Tutor";

              if (isUser) {
                return (
                  <li key={message.id} className="group flex flex-col items-end">
                    <div className="mb-1 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onCopy(message)}
                        title={isCopied ? "Tersalin" : "Salin pesan"}
                        aria-label={copyLabel}
                        className={cn(
                          "inline-flex size-10 items-center justify-center rounded-[6px] text-muted transition-opacity hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
                          isCopied
                            ? "opacity-100 text-ok"
                            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                        )}
                      >
                        {isCopied ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <Copy className="size-4" aria-hidden="true" />
                        )}
                      </button>
                      <span className="shrink-0 whitespace-nowrap text-xs font-semibold tracking-[0.04em] text-ink-soft">
                        Kamu
                      </span>
                    </div>
                    <div className="min-w-0 max-w-[min(42rem,92%)] rounded-[12px] border border-line bg-surface-2 px-4 py-3 text-[15px] leading-[1.65] text-ink">
                      <MessageContent content={message.content} />
                      {message.failed ? (
                        <p className="mt-2 text-xs font-medium text-danger">
                          Pesan belum terkirim · coba kirim ulang di bawah
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              }

              return (
                <li key={message.id} className="group flex flex-col items-start">
                  <div className="mb-1.5 flex w-full items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-text">
                      <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>LearnCode AI</span>
                    </span>
                    {message.content && !message.streaming ? (
                      <button
                        type="button"
                        onClick={() => onCopy(message)}
                        title={isCopied ? "Tersalin" : "Salin pesan"}
                        aria-label={copyLabel}
                        className={cn(
                          "inline-flex size-10 items-center justify-center rounded-[6px] text-muted transition-opacity hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
                          isCopied
                            ? "opacity-100 text-ok"
                            : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                        )}
                      >
                        {isCopied ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <Copy className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    ) : null}
                  </div>
                  <div className="w-full min-w-0 border-l-2 border-accent/25 pl-3.5 sm:pl-4">
                    {message.content ? (
                      <MessageContent content={message.content} />
                    ) : message.streaming ? (
                      <div
                        className="inline-flex items-center gap-2 py-1 text-sm text-muted"
                        role="status"
                      >
                        <span className="flex items-center gap-1" aria-hidden="true">
                          <span className="size-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
                          <span className="size-1.5 animate-pulse rounded-full bg-accent [animation-delay:150ms] motion-reduce:animate-none" />
                          <span className="size-1.5 animate-pulse rounded-full bg-accent [animation-delay:300ms] motion-reduce:animate-none" />
                        </span>
                        <span>AI Tutor sedang menyusun jawaban…</span>
                      </div>
                    ) : null}
                    {message.streaming && message.content ? (
                      <span
                        className="mt-1 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle motion-reduce:animate-none"
                        aria-hidden="true"
                      />
                    ) : null}
                    {message.stopped ? (
                      <p className="mt-2 text-xs font-medium text-muted">
                        Respons dihentikan oleh pengguna.
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mx-auto mt-3 max-w-[50rem] rounded-[8px] border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink"
          >
            <p>{error.message}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {error.retryable ? (
                <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                  <RotateCcw aria-hidden="true" />
                  Coba lagi
                </Button>
              ) : null}
              <button
                type="button"
                onClick={onDismissError}
                className="min-h-8 rounded-[5px] px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {showLatest ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-label="Gulir ke pesan terbaru"
          className="absolute bottom-4 right-4 z-10 h-9 rounded-full border-line-strong bg-surface/95 px-3.5 shadow-md backdrop-blur-xs sm:right-6"
          onClick={() => {
            const node = scrollRef.current;
            if (!node) return;
            node.scrollTo({ top: node.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            atBottomRef.current = true;
            setShowLatest(false);
          }}
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
          <span>Pesan terbaru</span>
        </Button>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {error ? error.message : ""}
      </p>
    </div>
  );
}

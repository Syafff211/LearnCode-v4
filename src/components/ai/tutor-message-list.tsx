"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowDown, Check, Copy, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
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

function CopyCodeButton({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const value = textFromNode(children);

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
    <div className="overflow-hidden rounded-[6px] border border-line bg-[var(--lc-code-bg)]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">Kode</span>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={copied ? "Kode tersalin" : "Salin blok kode"}
          className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
        >
          {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
          {copied ? "Tersalin" : "Salin kode"}
        </button>
      </div>
      <pre className="m-0 max-w-full overflow-x-auto p-3 font-mono text-[12px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <div className="chat-prose">
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
            <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
              Gambar tidak dimuat{alt ? `: ${alt}` : ""}
            </span>
          ),
          pre: ({ children }) => <CopyCodeButton>{children}</CopyCodeButton>,
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
  onCopy,
  onRetry,
  onDismissError,
  onSuggestion,
}: {
  messages: TutorMessage[];
  error: TutorError | null;
  loading: boolean;
  copiedId: string | null;
  forceScrollVersion: number;
  onCopy: (message: TutorMessage) => void;
  onRetry: () => void;
  onDismissError: () => void;
  onSuggestion: (value: string) => void;
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
      // Token-by-token stream updates follow only while the learner is already
      // at the latest response; reading older messages never yanks the scroll.
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, error, forceScrollVersion]);

  function handleScroll() {
    const node = scrollRef.current;
    if (!node) return;
    const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 88;
    atBottomRef.current = atBottom;
    setShowLatest(!atBottom && messages.length > 0);
  }

  async function copyMessage(message: TutorMessage) {
    await onCopy(message);
  }

  const suggestions = [
    "Apa perbedaan Flexbox dan Grid?",
    "Jelaskan box model dengan contoh.",
    "Bantu saya memahami error JavaScript ini.",
  ];

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Percakapan dengan LearnCode AI"
        className="h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
      >
        {loading ? (
          <div className="mx-auto flex max-w-xl items-center gap-2 rounded-[6px] border border-line bg-surface px-3 py-2 text-xs text-muted" role="status">
            <span className="size-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" aria-hidden="true" />
            Memuat percakapan…
          </div>
        ) : null}

        {messages.length === 0 && !loading ? (
          <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full border border-line bg-surface">
              <Sparkles className="size-4 text-accent-text" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink">Apa yang ingin kamu pahami?</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Tanya tentang kode, tempel error, atau minta hint untuk latihan. AI Tutor tidak menjalankan kode.
            </p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onSuggestion(suggestion)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.length > 0 ? (
          <ol className="mx-auto flex max-w-4xl flex-col gap-5 pb-10">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}
              >
                <span className="mb-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                  {message.role === "user" ? "Kamu" : "LearnCode AI"}
                </span>
                <div
                  className={cn(
                    "max-w-[min(88ch,96%)] rounded-[8px] border px-3.5 py-3 sm:px-4",
                    message.role === "user"
                      ? "border-line bg-surface-2"
                      : "border-line bg-surface",
                  )}
                >
                  {message.content ? (
                    <MessageContent content={message.content} />
                  ) : message.streaming ? (
                    <span className="flex items-center gap-1.5 py-1 text-xs text-muted" role="status">
                      <span className="size-1.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
                      <span className="size-1.5 animate-pulse rounded-full bg-accent [animation-delay:150ms] motion-reduce:animate-none" />
                      <span className="size-1.5 animate-pulse rounded-full bg-accent [animation-delay:300ms] motion-reduce:animate-none" />
                      <span className="sr-only">AI sedang menulis jawaban</span>
                    </span>
                  ) : null}
                  {message.streaming && message.content ? (
                    <span className="mt-1 inline-block h-3.5 w-[2px] animate-pulse bg-accent align-middle motion-reduce:animate-none" aria-hidden="true" />
                  ) : null}
                  {message.stopped ? (
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">Respons dihentikan</p>
                  ) : null}
                  {message.failed ? (
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-danger">Pesan belum terkirim · coba lagi di bawah</p>
                  ) : null}
                  {message.content && !message.streaming ? (
                    <div className="mt-2 flex items-center gap-2 border-t border-line pt-1.5">
                      <button
                        type="button"
                        onClick={() => void copyMessage(message)}
                        aria-label={copiedId === message.id ? "Pesan tersalin" : `Salin pesan ${message.role === "user" ? "kamu" : "AI Tutor"}`}
                        className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
                      >
                        {copiedId === message.id ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
                        {copiedId === message.id ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}

        {error ? (
          <div role="alert" className="mx-auto mt-2 max-w-4xl rounded-[7px] border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-ink-soft">
            <p>{error.message}</p>
            <div className="mt-2 flex items-center gap-2">
              {error.retryable ? (
                <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                  <RotateCcw aria-hidden="true" />
                  Coba lagi
                </Button>
              ) : null}
              <button
                type="button"
                onClick={onDismissError}
                className="rounded-[3px] px-2 py-1 text-xs text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
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
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 shadow-sm"
          onClick={() => {
            const node = scrollRef.current;
            if (!node) return;
            node.scrollTo({ top: node.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
            atBottomRef.current = true;
            setShowLatest(false);
          }}
        >
          <ArrowDown aria-hidden="true" />
          Pesan terbaru
        </Button>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {error ? error.message : ""}
      </p>
    </div>
  );
}

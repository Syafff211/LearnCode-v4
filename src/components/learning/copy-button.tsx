"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ value, label = "Salin kode" }: { value: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Disalin ke clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Clipboard tidak tersedia di browser ini.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-surface px-2 py-1 text-[10px] text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
    >
      {copied ? (
        <Check className="size-3 text-ok" aria-hidden="true" />
      ) : (
        <Copy className="size-3" aria-hidden="true" />
      )}
      {copied ? "Tersalin" : "Salin"}
    </button>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";

import { CodeWorkspace } from "@/components/playground/code-workspace";
import { playgroundExamples } from "@/content/playground-examples";
import { cn } from "@/lib/utils";

export function PlaygroundWorkspace() {
  const [selectedId, setSelectedId] = React.useState(playgroundExamples[0]?.id ?? "starter");
  const selected = playgroundExamples.find((example) => example.id === selectedId) ?? playgroundExamples[0];

  if (!selected) return null;

  function choose(id: string) {
    if (id === selectedId) return;
    const next = playgroundExamples.find((example) => example.id === id);
    if (!next) return;
    const confirmed = window.confirm(
      `Muat contoh "${next.label}"? Kode yang sedang diedit akan diganti. Simpan dulu jika perlu.`,
    );
    if (!confirmed) return;
    setSelectedId(id);
    toast.success(`Contoh "${next.label}" dimuat`);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          Contoh kode
        </span>
        {playgroundExamples.map((example) => (
          <button
            key={example.id}
            type="button"
            onClick={() => choose(example.id)}
            aria-pressed={selected.id === example.id}
            className={cn(
              "rounded-[4px] border px-2.5 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text",
              selected.id === example.id
                ? "border-accent/40 bg-accent-soft text-accent-text"
                : "border-line bg-surface text-ink-soft hover:border-line-strong",
            )}
          >
            {example.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-muted">{selected.description}</p>
      <CodeWorkspace key={selected.id} initialFiles={selected.files} allowSave />
    </div>
  );
}

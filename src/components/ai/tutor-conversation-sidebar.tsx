"use client";

import * as React from "react";
import { Check, History, LoaderCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatShortDate } from "@/lib/utils";
import type { TutorConversation } from "@/components/ai/tutor-chat-types";

export function TutorConversationSidebar({
  idPrefix,
  conversations,
  activeId,
  search,
  loading,
  error,
  onSearch,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  idPrefix: string;
  conversations: TutorConversation[];
  activeId: string | null;
  search: string;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (conversation: TutorConversation) => void;
}) {
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [savingRename, setSavingRename] = React.useState(false);

  function beginRename(conversation: TutorConversation) {
    setRenamingId(conversation.id);
    setRenameValue(conversation.title);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue("");
  }

  async function saveRename(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (savingRename || !renameValue.trim()) return;
    setSavingRename(true);
    const saved = await onRename(id, renameValue.trim());
    setSavingRename(false);
    if (saved) cancelRename();
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-3">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
          <History className="size-3.5" aria-hidden="true" />
          Riwayat
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={onNew}>
          <Plus aria-hidden="true" />
          Baru
        </Button>
      </div>

      <div className="relative border-b border-line px-3 py-2.5">
        <label htmlFor={`tutor-history-search-${idPrefix}`} className="sr-only">Cari percakapan</label>
        <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={`tutor-history-search-${idPrefix}`}
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Cari judul atau isi pesan…"
          maxLength={80}
          autoComplete="off"
          className="h-9 w-full rounded-[5px] border border-line bg-canvas pl-8 pr-8 text-xs text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
        />
        {loading ? (
          <LoaderCircle className="absolute right-5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted motion-reduce:animate-none" aria-label="Mencari" />
        ) : search ? (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={() => onSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mx-3 mt-2 rounded-[5px] border border-danger/25 bg-danger-soft px-2.5 py-2 text-xs text-ink-soft" role="alert">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-2" aria-busy={loading}>
        {conversations.length === 0 ? (
          <div className="px-2 py-4 text-xs leading-relaxed text-muted" role={loading ? "status" : undefined}>
            {loading
              ? "Mencari percakapan…"
              : search.trim()
                ? "Tidak ada percakapan yang cocok dengan pencarian."
                : "Belum ada percakapan. Mulai chat baru untuk menyimpan riwayat."}
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id} className="group relative">
                {renamingId === conversation.id ? (
                  <form onSubmit={(event) => void saveRename(event, conversation.id)} className="space-y-2 rounded-[5px] border border-line bg-canvas p-2">
                    <label htmlFor={`rename-${idPrefix}-${conversation.id}`} className="sr-only">Nama percakapan</label>
                    <input
                      id={`rename-${idPrefix}-${conversation.id}`}
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      maxLength={80}
                      autoFocus
                      className="h-8 w-full rounded-[4px] border border-line bg-surface px-2 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelRename();
                        }
                      }}
                    />
                    <div className="flex justify-end gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={cancelRename} disabled={savingRename}>
                        Batal
                      </Button>
                      <Button type="submit" size="sm" disabled={!renameValue.trim() || savingRename} loading={savingRename}>
                        <Check aria-hidden="true" />
                        Simpan
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelect(conversation.id)}
                      aria-current={activeId === conversation.id ? "true" : undefined}
                      className={cn(
                        "w-full rounded-[5px] px-2.5 py-2.5 pr-[4.6rem] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
                        activeId === conversation.id
                          ? "bg-surface-2 text-ink"
                          : "text-ink-soft hover:bg-surface-2/70",
                      )}
                    >
                      <span className="block truncate text-xs font-medium">{conversation.title}</span>
                      <span className="mt-1 block font-mono text-[9px] text-muted">
                        {formatShortDate(conversation.updated_at)}
                      </span>
                    </button>
                    <div className="absolute right-1.5 top-2 flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 motion-reduce:transition-none">
                      <button
                        type="button"
                        aria-label={`Ubah nama percakapan ${conversation.title}`}
                        title="Ubah nama"
                        onClick={() => beginRename(conversation)}
                        className="rounded-[4px] p-1.5 text-muted hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                      >
                        <Pencil className="size-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus percakapan ${conversation.title}`}
                        title="Hapus"
                        onClick={() => onDelete(conversation)}
                        className="rounded-[4px] p-1.5 text-muted hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                      >
                        <Trash2 className="size-3" aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line px-3.5 py-2 text-[10px] text-muted">
        Hanya kamu yang dapat membuka riwayat akunmu.
      </div>
    </div>
  );
}

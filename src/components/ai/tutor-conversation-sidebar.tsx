"use client";

import {
  History,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { TutorConversation } from "@/components/ai/tutor-chat-types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatConversationActivity,
  formatConversationDisplayTitle,
} from "@/lib/ai/tutor-ui";
import { cn } from "@/lib/utils";

export function TutorConversationSidebar({
  idPrefix,
  conversations,
  activeId,
  lessonTitleById,
  search,
  loading,
  error,
  onSearch,
  onSelect,
  onNew,
  onOpenRename,
  onOpenDelete,
  onCloseDrawer,
}: {
  idPrefix: string;
  conversations: TutorConversation[];
  activeId: string | null;
  lessonTitleById?: Map<string, string>;
  search: string;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onOpenRename: (conversation: TutorConversation) => void;
  onOpenDelete: (conversation: TutorConversation) => void;
  onCloseDrawer?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted">
          <History className="size-4 text-accent-text" aria-hidden="true" />
          <span>Riwayat</span>
        </span>
        <div className="flex items-center gap-1.5">
          <Button type="button" size="sm" variant="primary" onClick={onNew}>
            <Plus aria-hidden="true" />
            <span>Percakapan baru</span>
          </Button>
          {onCloseDrawer ? (
            <button
              type="button"
              onClick={onCloseDrawer}
              aria-label="Tutup riwayat percakapan"
              className="inline-flex size-9 items-center justify-center rounded-[6px] text-muted transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative border-b border-line px-3 py-2.5">
        <label htmlFor={`tutor-history-search-${idPrefix}`} className="sr-only">
          Cari riwayat percakapan
        </label>
        <Search
          className="pointer-events-none absolute left-5.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          id={`tutor-history-search-${idPrefix}`}
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Cari judul atau isi pesan…"
          maxLength={80}
          autoComplete="off"
          className="h-10 w-full rounded-[6px] border border-line bg-canvas pl-9 pr-9 text-sm text-ink placeholder:text-muted focus-visible:border-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text/25"
        />
        {loading ? (
          <LoaderCircle
            className="absolute right-5.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted motion-reduce:animate-none"
            aria-label="Mencari percakapan"
          />
        ) : search ? (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={() => onSearch("")}
            className="absolute right-4 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-[4px] text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {error ? (
        <p
          className="mx-3 mt-2.5 rounded-[6px] border border-danger/25 bg-danger-soft px-3 py-2 text-xs leading-relaxed text-ink"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-2" aria-busy={loading}>
        {conversations.length === 0 ? (
          <div
            className="px-2.5 py-6 text-center text-xs leading-relaxed text-muted"
            role={loading ? "status" : undefined}
          >
            {loading
              ? "Mencari percakapan…"
              : search.trim()
                ? "Tidak ada percakapan yang cocok dengan kata kunci."
                : "Belum ada riwayat percakapan. Mulai chat baru untuk menyimpannya di akunmu."}
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => {
              const isActive = activeId === conversation.id;
              const lessonTitle = conversation.lesson_id
                ? lessonTitleById?.get(conversation.lesson_id) ?? null
                : null;
              const displayTitle = formatConversationDisplayTitle(
                conversation.title,
                lessonTitle,
              );

              return (
                <li key={conversation.id} className="group relative flex items-center">
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={isActive ? "true" : undefined}
                    title={conversation.title}
                    className={cn(
                      "w-full min-w-0 rounded-[6px] border py-2.5 pl-3 pr-11 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
                      isActive
                        ? "border-accent/35 bg-accent-soft/65 text-ink"
                        : "border-transparent text-ink-soft hover:bg-surface-2/80 hover:text-ink",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {isActive ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-accent"
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className={cn("block truncate text-sm", isActive ? "font-semibold" : "font-medium")}>
                        {displayTitle}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {formatConversationActivity(conversation.updated_at)}
                    </span>
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={`Tindakan untuk ${displayTitle}`}
                        title="Tindakan percakapan"
                        className={cn(
                          "absolute right-1 inline-flex size-10 items-center justify-center rounded-[6px] text-muted transition-opacity hover:bg-surface hover:text-ink focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none",
                          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 data-[state=open]:opacity-100",
                        )}
                      >
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onSelect={() => onOpenRename(conversation)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        <span>Ubah nama</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onOpenDelete(conversation)}
                        className="text-danger focus:bg-danger-soft focus:text-danger"
                      >
                        <Trash2 className="size-4 text-danger" aria-hidden="true" />
                        <span>Hapus</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-line px-3.5 py-2.5 text-xs leading-relaxed text-muted">
        Riwayat percakapan hanya dapat diakses oleh akunmu.
      </div>
    </div>
  );
}

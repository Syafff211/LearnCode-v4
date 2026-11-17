"use client";

import {
  BookOpen,
  Bug,
  ClipboardCheck,
  FileSearch,
  FlaskConical,
  HelpCircle,
  Languages,
  Lightbulb,
  MessageSquare,
  X,
  type LucideIcon,
} from "lucide-react";

import type { TutorLessonOption } from "@/components/ai/tutor-chat-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TUTOR_LANGUAGES,
  TUTOR_MODES,
  TUTOR_MODE_MAP,
} from "@/lib/ai/tutor-ui";
import { cn } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";

const modeIcons: Record<AiAction, LucideIcon> = {
  free_chat: MessageSquare,
  explain_code: FileSearch,
  debug_code: Bug,
  hint: Lightbulb,
  code_review: ClipboardCheck,
  explain_lesson: BookOpen,
  practice_suggestions: FlaskConical,
};

export function TutorModeToolbar({
  mode,
  lessonId,
  fixedLesson,
  lessonOptions,
  language,
  disabled,
  onModeChange,
  onLessonChange,
  onLanguageChange,
}: {
  mode: AiAction;
  lessonId: string | null;
  fixedLesson: { id: string; title: string } | null;
  lessonOptions: TutorLessonOption[];
  language: "id" | "en";
  disabled: boolean;
  onModeChange: (mode: AiAction) => void;
  onLessonChange: (lessonId: string | null) => void;
  onLanguageChange: (language: "id" | "en") => void;
}) {
  const activeFixedLesson = fixedLesson && lessonId === fixedLesson.id ? fixedLesson : null;
  const selectedLesson = lessonOptions.find((lesson) => lesson.id === lessonId);
  const activeMeta = TUTOR_MODE_MAP[mode];
  const needsLessonNotice = mode === "explain_lesson" && !lessonId;

  return (
    <div className="shrink-0 border-b border-line bg-canvas/95 px-3 py-2 sm:px-5">
      <div className="mx-auto max-w-[50rem] space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div
            role="group"
            aria-label="Mode AI Tutor"
            className="scrollbar-none flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-0.5"
          >
            {TUTOR_MODES.map((entry) => {
              const Icon = modeIcons[entry.action];
              const isActive = mode === entry.action;
              return (
                <button
                  key={entry.action}
                  type="button"
                  onClick={() => onModeChange(entry.action)}
                  aria-pressed={isActive}
                  title={entry.description}
                  disabled={disabled}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none",
                    isActive
                      ? "border-accent bg-accent text-accent-ink shadow-xs"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{entry.label}</span>
                </button>
              );
            })}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Lihat penjelasan semua mode AI Tutor"
                title="Penjelasan 7 mode AI"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface text-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text motion-reduce:transition-none"
              >
                <HelpCircle className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-3">
              <p className="text-xs font-semibold text-ink">Panduan 7 Mode AI Tutor</p>
              <ul className="mt-2 space-y-2">
                {TUTOR_MODES.map((entry) => {
                  const Icon = modeIcons[entry.action];
                  const isActive = entry.action === mode;
                  return (
                    <li
                      key={entry.action}
                      className={cn(
                        "flex items-start gap-2 rounded-[5px] px-2 py-1.5",
                        isActive ? "bg-accent-soft/70" : "",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 size-3.5 shrink-0",
                          isActive ? "text-accent-text" : "text-muted",
                        )}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink">
                          {entry.label}
                          {isActive ? (
                            <span className="ml-1.5 text-xs font-normal text-accent-text">
                              (Aktif)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs leading-snug text-muted">{entry.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="min-w-0 text-xs leading-snug text-muted">
              <span className="font-medium text-ink-soft">{activeMeta.label}:</span>{" "}
              <span>{activeMeta.description}</span>
            </p>

            {activeFixedLesson ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-[5px] border border-line bg-surface px-2 py-1 text-xs text-ink-soft">
                <BookOpen className="size-3.5 shrink-0 text-accent-text" aria-hidden="true" />
                <span className="truncate">Lesson: {activeFixedLesson.title}</span>
                <button
                  type="button"
                  onClick={() => onLessonChange(null)}
                  aria-label="Hapus konteks lesson"
                  disabled={disabled}
                  className="rounded p-0.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ) : fixedLesson ? (
              <button
                type="button"
                onClick={() => onLessonChange(fixedLesson.id)}
                disabled={disabled}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-[5px] border border-dashed border-line-strong px-2 py-1 text-xs text-muted hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
              >
                <BookOpen className="size-3.5 text-accent-text" aria-hidden="true" />
                Gunakan konteks lesson
              </button>
            ) : lessonOptions.length > 0 ? (
              <label className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-xs text-muted">
                <BookOpen
                  className={cn(
                    "size-3.5 shrink-0",
                    needsLessonNotice ? "text-highlight" : "text-accent-text",
                  )}
                  aria-hidden="true"
                />
                <span className="sr-only">Pilih lesson untuk konteks AI</span>
                <select
                  value={lessonId ?? ""}
                  onChange={(event) => onLessonChange(event.target.value || null)}
                  disabled={disabled}
                  aria-label="Konteks lesson"
                  className={cn(
                    "h-8 max-w-[min(74vw,17rem)] truncate rounded-[5px] border bg-surface px-2 text-xs text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-60",
                    needsLessonNotice ? "border-highlight/60" : "border-line",
                  )}
                >
                  <option value="">Tanpa konteks lesson</option>
                  {lessonOptions.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.courseTitle} — {lesson.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : selectedLesson ? (
              <span className="text-xs text-muted">Lesson: {selectedLesson.title}</span>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Languages className="size-3.5 text-accent-text" aria-hidden="true" />
              <span>Bahasa jawaban AI:</span>
            </span>
            <div
              role="group"
              aria-label="Bahasa jawaban AI"
              className="inline-flex items-center rounded-[6px] border border-line bg-surface p-0.5"
            >
              {TUTOR_LANGUAGES.map((entry) => {
                const active = language === entry.value;
                return (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => onLanguageChange(entry.value)}
                    aria-pressed={active}
                    disabled={disabled}
                    className={cn(
                      "rounded-[4px] px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none",
                      active
                        ? "bg-accent text-accent-ink"
                        : "text-muted hover:text-ink",
                    )}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

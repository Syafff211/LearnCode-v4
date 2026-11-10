"use client";

import {
  BookOpen,
  Bug,
  ClipboardCheck,
  FileSearch,
  FlaskConical,
  Lightbulb,
  MessageSquare,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AiAction } from "@/lib/validation/ai";
import type { TutorLessonOption } from "@/components/ai/tutor-chat-types";

const modes: { action: AiAction; label: string; icon: LucideIcon }[] = [
  { action: "free_chat", label: "Tanya", icon: MessageSquare },
  { action: "explain_code", label: "Jelaskan kode", icon: FileSearch },
  { action: "debug_code", label: "Debug", icon: Bug },
  { action: "hint", label: "Hint", icon: Lightbulb },
  { action: "code_review", label: "Review", icon: ClipboardCheck },
  { action: "explain_lesson", label: "Jelaskan lesson", icon: BookOpen },
  { action: "practice_suggestions", label: "Latihan", icon: FlaskConical },
];

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

  return (
    <div className="shrink-0 border-b border-line bg-canvas/90 px-3 py-2 sm:px-4">
      <div
        role="group"
        aria-label="Mode LearnCode AI"
        className="flex min-w-0 gap-1 overflow-x-auto pb-1"
      >
        {modes.map((entry) => (
          <button
            key={entry.action}
            type="button"
            onClick={() => onModeChange(entry.action)}
            aria-pressed={mode === entry.action}
            disabled={disabled}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[5px] border px-2.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none",
              mode === entry.action
                ? "border-accent/35 bg-accent-soft text-accent-text"
                : "border-transparent text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            <entry.icon className="size-3.5" aria-hidden="true" />
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-1 flex min-h-8 flex-wrap items-center gap-2">
        {activeFixedLesson ? (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-[5px] border border-line bg-surface px-2 py-1 text-[10px] text-ink-soft">
            <BookOpen className="size-3 shrink-0 text-accent-text" aria-hidden="true" />
            <span className="truncate">Konteks: {activeFixedLesson.title}</span>
            <button
              type="button"
              onClick={() => onLessonChange(null)}
              aria-label="Hapus konteks lesson"
              disabled={disabled}
              className="rounded p-0.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ) : fixedLesson ? (
          <button
            type="button"
            onClick={() => onLessonChange(fixedLesson.id)}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-dashed border-line-strong px-2 py-1 text-[10px] text-muted hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
          >
            <BookOpen className="size-3 text-accent-text" aria-hidden="true" />
            Tambahkan konteks lesson
          </button>
        ) : lessonOptions.length > 0 ? (
          <label className="flex items-center gap-1.5 text-[10px] text-muted">
            <BookOpen className="size-3 text-accent-text" aria-hidden="true" />
            <span className="sr-only">Konteks lesson</span>
            <select
              value={lessonId ?? ""}
              onChange={(event) => onLessonChange(event.target.value || null)}
              disabled={disabled}
              aria-label="Konteks lesson"
              className="h-7 max-w-[min(62vw,20rem)] rounded-[4px] border border-line bg-surface px-2 text-[10px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-60"
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
          <span className="text-[10px] text-muted">Konteks: {selectedLesson.title}</span>
        ) : null}

        <div role="group" aria-label="Bahasa jawaban" className="ml-auto flex items-center rounded-[4px] border border-line p-0.5">
          {(["id", "en"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onLanguageChange(value)}
              aria-pressed={language === value}
              disabled={disabled}
              className={cn(
                "rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text disabled:opacity-55 motion-reduce:transition-none",
                language === value ? "bg-surface-2 text-ink" : "text-muted hover:text-ink",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

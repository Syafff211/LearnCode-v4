import Link from "next/link";
import { ArrowLeft, Award, Check, FileQuestion } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { CourseSummary, LessonMeta } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function LessonNav({
  course,
  lessons,
  activeSlug,
  completedSlugs,
  quizAvailable,
  courseHref,
  certificateNumber,
  onNavigate,
}: {
  course: CourseSummary;
  lessons: LessonMeta[];
  activeSlug: string;
  completedSlugs: string[];
  quizAvailable: boolean;
  courseHref: string;
  certificateNumber?: string | null;
  onNavigate?: () => void;
}) {
  const completed = new Set(completedSlugs);
  const completedCount = lessons.filter((lesson) => completed.has(lesson.slug)).length;
  const percent = lessons.length === 0 ? 0 : Math.round((completedCount / lessons.length) * 100);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-4">
        <Link
          href={courseHref}
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3" aria-hidden="true" />
          Detail kursus
        </Link>
        <p className="mt-2 text-sm font-medium leading-snug text-ink">{course.title}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] text-muted">
            {completedCount}/{lessons.length} lesson
          </span>
          <span className="font-mono text-[10px] text-muted">{percent}%</span>
        </div>
        <Progress value={percent} className="mt-1.5" label="Progress kursus" />
      </div>

      <nav aria-label="Daftar lesson" className="min-h-0 flex-1 overflow-y-auto py-2">
        <ol>
          {lessons.map((lesson, index) => {
            const done = completed.has(lesson.slug);
            const active = lesson.slug === activeSlug;
            return (
              <li key={lesson.slug}>
                <Link
                  href={`/learn/${lesson.slug}`}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-start gap-2.5 border-l-2 px-4 py-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-text",
                    active
                      ? "border-accent bg-surface-2 text-ink"
                      : "border-transparent text-ink-soft hover:bg-surface-2/70 hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "mt-px flex size-4 shrink-0 items-center justify-center rounded-full border font-mono text-[8px]",
                      done
                        ? "border-ok/30 bg-ok-soft text-ok"
                        : active
                          ? "border-accent/40 bg-accent-soft text-accent-text"
                          : "border-line-strong text-muted",
                    )}
                    aria-hidden="true"
                  >
                    {done ? <Check className="size-2.5" /> : index + 1}
                  </span>
                  <span className="flex-1 leading-snug">
                    {lesson.title}
                    <span className="mt-0.5 block font-mono text-[9px] text-muted">
                      {lesson.estimatedMinutes} menit
                    </span>
                  </span>
                  <span className="sr-only">{done ? "selesai" : "belum selesai"}</span>
                </Link>
              </li>
            );
          })}
        </ol>

        {quizAvailable ? (
          <div className="mt-1 border-t border-line pt-1">
            <Link
              href={`/courses/${course.slug}/quiz`}
              onClick={onNavigate}
              className="flex items-start gap-2.5 px-4 py-2.5 text-xs text-ink-soft transition-colors hover:bg-surface-2/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-text"
            >
              <FileQuestion className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
              <span>
                Quiz akhir kursus
                <span className="mt-0.5 block font-mono text-[9px] text-muted">
                  Passing {course.passingScore}%
                </span>
              </span>
            </Link>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-line p-4">
        {certificateNumber ? (
          <Link
            href={`/certificates/${certificateNumber}`}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-[4px] border border-ok/25 bg-ok-soft px-2.5 py-2 text-xs text-ink-soft transition-colors hover:border-ok/40"
          >
            <Award className="size-3.5 text-ok" aria-hidden="true" />
            Sertifikat sudah terbit
          </Link>
        ) : (
          <p className="text-[10px] leading-relaxed text-muted">
            Tandai lesson selesai setelah kamu bisa menjelaskan inti materinya.
            Progress disimpan di akunmu.
          </p>
        )}
      </div>
    </div>
  );
}

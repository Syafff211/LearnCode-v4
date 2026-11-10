import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import type { CourseSummary } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

const courseNumbers: Record<string, string> = {
  "html-fundamentals": "01",
  "css-fundamentals": "02",
  "javascript-fundamentals": "03",
};

export function CourseCard({ course, compact = false }: { course: CourseSummary; compact?: boolean }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className={`course-card group flex flex-col rounded-[8px] border border-line bg-surface ${compact ? "p-4 sm:p-5" : "p-5 sm:p-6"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-canvas`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-mono text-xs tracking-[0.08em] text-muted">
          {courseNumbers[course.slug] ?? String(course.position).padStart(2, "0")}
        </span>
        <Badge variant="outline">{course.level}</Badge>
      </div>

      <h3 className={`${compact ? "mt-5" : "mt-7"} font-display text-[1.55rem] leading-[1.1] tracking-[-0.015em] text-ink`}>
        {course.title}
      </h3>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">{course.tagline}</p>

      {!compact ? (
        <ul className="mt-5 space-y-1.5 border-t border-line pt-4">
          {course.lessons.slice(0, 3).map((lesson) => (
            <li key={lesson.slug} className="flex items-start gap-2 text-[0.8125rem] text-ink-soft">
              <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-line-strong" />
              <span className="line-clamp-1">{lesson.title}</span>
            </li>
          ))}
          {course.lessons.length > 3 ? (
            <li className="pl-3 text-xs text-muted">
              +{course.lessons.length - 3} lesson lainnya
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-muted">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatDuration(course.durationMinutes)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{course.lessons.length} lesson</span>
        </span>
        <span className="course-arrow flex items-center gap-1 text-ink-soft">
          <span className="sr-only">Buka kursus {course.title}</span>
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

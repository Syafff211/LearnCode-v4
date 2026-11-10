"use client";

import * as React from "react";
import { ListOrdered } from "lucide-react";

import { LessonNav } from "@/components/learning/lesson-nav";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CourseSummary, LessonMeta } from "@/lib/data/types";

export function MobileLessonNav(props: {
  course: CourseSummary;
  lessons: LessonMeta[];
  activeSlug: string;
  completedSlugs: string[];
  quizAvailable: boolean;
  courseHref: string;
  certificateNumber?: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const completedCount = props.lessons.filter((lesson) =>
    props.completedSlugs.includes(lesson.slug),
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[5px] border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
        >
          <ListOrdered className="size-3.5" aria-hidden="true" />
          Daftar lesson
          <span className="font-mono text-[10px] text-muted">
            {completedCount}/{props.lessons.length}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="left-auto right-0 top-0 h-dvh w-[min(22rem,92vw)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-r-0 p-0"
        hideClose
      >
        <DialogTitle className="sr-only">Daftar lesson</DialogTitle>
        <div className="h-full pt-3">
          <LessonNav {...props} onNavigate={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

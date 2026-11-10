import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Clock,
  Code2,
  FileQuestion,
} from "lucide-react";

import { CopyButton } from "@/components/learning/copy-button";
import { LessonCompleteButton } from "@/components/learning/lesson-complete-button";
import { LessonExercise } from "@/components/learning/lesson-exercise";
import { LessonNav } from "@/components/learning/lesson-nav";
import { MobileLessonNav } from "@/components/learning/mobile-lesson-nav";
import { TutorDrawer } from "@/components/learning/tutor-drawer";
import { YouTubeVideo } from "@/components/learning/youtube-video";
import { Badge } from "@/components/ui/badge";
import { languageLabel } from "@/content/types";
import type { LearningLesson } from "@/lib/data/learning";
import { formatDate } from "@/lib/utils";

type TutorConfig = {
  lessonId: string;
  lessonTitle: string;
  defaultLanguage: "id" | "en";
  initialUsed: number;
  dailyLimit: number;
  aiConfigured: boolean;
};

/**
 * Presentation for the learning workspace. All data is loaded and authorized
 * by the route; this component performs no fetches of its own.
 */
export function LessonWorkspaceView({
  lesson,
  contentHtml,
  nextHref,
  previousHref,
  quizHref,
  quizAttempted,
  certificateNumber,
  tutor,
}: {
  lesson: LearningLesson;
  contentHtml: string;
  nextHref: string | null;
  previousHref: string | null;
  quizHref: string | null;
  quizAttempted: boolean;
  certificateNumber: string | null;
  tutor: TutorConfig;
}) {
  const index = lesson.siblings.findIndex((sibling) => sibling.slug === lesson.slug);
  const previousTitle = index > 0 ? lesson.siblings[index - 1]?.title : null;
  const nextTitle = index >= 0 ? lesson.siblings[index + 1]?.title : null;

  const navProps = {
    course: lesson.course,
    lessons: lesson.siblings,
    activeSlug: lesson.slug,
    completedSlugs: lesson.completedLessonIds,
    quizAvailable: Boolean(lesson.quizId),
    courseHref: `/courses/${lesson.course.slug}`,
    certificateNumber,
  };

  const code = lesson.codeExample;
  const hasCode = Boolean(code?.code);

  return (
    <div className="mx-auto w-full max-w-[1360px]">
      <div className="flex items-stretch">
        <aside className="sticky top-[3.8125rem] hidden h-[calc(100dvh-3.8125rem)] w-64 shrink-0 border-r border-line lg:block xl:w-72">
          <LessonNav {...navProps} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-line px-5 py-6 sm:px-7 lg:px-8 lg:py-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  <li>
                    <Link href="/dashboard" className="hover:text-ink">
                      Dashboard
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link href={`/courses/${lesson.course.slug}`} className="hover:text-ink">
                      {lesson.course.title}
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="text-ink-soft">
                    Lesson {String(lesson.position).padStart(2, "0")}
                  </li>
                </ol>
              </nav>
              <div className="flex items-center gap-2">
                <MobileLessonNav {...navProps} />
                <TutorDrawer
                  {...tutor}
                  lessonCodeLanguage={
                    code?.language === "css" || code?.language === "javascript"
                      ? code.language
                      : "html"
                  }
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Badge variant="accent">
                Lesson {String(lesson.position).padStart(2, "0")}/{lesson.siblings.length}
              </Badge>
              {lesson.completed ? (
                <Badge variant="success">
                  <Check aria-hidden="true" />
                  Selesai
                </Badge>
              ) : null}
              {lesson.certificate ? (
                <Badge variant="outline">
                  <Award aria-hidden="true" />
                  Sertifikat terbit
                </Badge>
              ) : null}
            </div>

            <h1 className="display-section mt-3 max-w-[22ch] text-[2rem] sm:text-[2.4rem]">
              {lesson.title}
            </h1>
            <p className="lead mt-3 max-w-[60ch] text-base">{lesson.summary}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3" aria-hidden="true" />
                {lesson.estimatedMinutes} menit
              </span>
              <span aria-hidden="true">·</span>
              <span>{lesson.course.title}</span>
              {lesson.certificate ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>sertifikat {formatDate(lesson.certificate.issued_at)}</span>
                </>
              ) : null}
            </p>
          </header>

          <article className="px-5 py-8 sm:px-7 lg:px-8 lg:py-10">
            <div className="max-w-[68ch]">
              <div className="prose-lc" dangerouslySetInnerHTML={{ __html: contentHtml }} />

              {lesson.youtubeVideo ? (
                <YouTubeVideo
                  className="mt-8"
                  videoId={lesson.youtubeVideo.videoId}
                  title={lesson.youtubeVideo.title}
                  description={lesson.youtubeVideo.description}
                />
              ) : null}

              {hasCode ? (
                <figure className="mt-10 overflow-hidden rounded-[8px] border border-line bg-surface">
                  <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] text-muted">
                      <Code2 className="size-3.5 text-accent-text" aria-hidden="true" />
                      {languageLabel[(code.language as keyof typeof languageLabel) ?? "html"] ??
                        "Kode"}{" "}
                      <span className="text-line-strong" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-ink-soft">{code.filename ?? "contoh"}</span>
                    </span>
                    <CopyButton value={code.code ?? ""} label="Salin contoh kode" />
                  </figcaption>
                  <pre className="max-h-[420px] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-ink-soft">
                    <code>{code.code}</code>
                  </pre>
                  {code.caption ? (
                    <p className="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-muted">
                      {code.caption}
                    </p>
                  ) : null}
                </figure>
              ) : null}
            </div>

            <LessonExercise exercise={lesson.exercise} lessonTitle={lesson.title} />

            <div className="max-w-[68ch]">
              <LessonCompleteButton
                lessonId={lesson.id}
                completed={lesson.completed}
                nextHref={nextHref}
                courseHref={`/courses/${lesson.course.slug}`}
                quizHref={quizHref}
                quizAttempted={quizAttempted}
                certificateNumber={certificateNumber}
              />
            </div>

            <nav
              aria-label="Navigasi antar lesson"
              className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm"
            >
              {previousHref ? (
                <Link
                  href={previousHref}
                  className="group inline-flex max-w-[45%] items-center gap-2 text-ink-soft hover:text-ink"
                >
                  <ArrowLeft className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                      Sebelumnya
                    </span>
                    {previousTitle}
                  </span>
                </Link>
              ) : (
                <Link
                  href={`/courses/${lesson.course.slug}`}
                  className="inline-flex items-center gap-2 text-ink-soft hover:text-ink"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Detail kursus
                </Link>
              )}

              {nextHref ? (
                <Link
                  href={nextHref}
                  className="group ml-auto inline-flex max-w-[45%] items-center gap-2 text-right text-ink-soft hover:text-ink"
                >
                  <span className="truncate">
                    <span className="block font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                      Selanjutnya
                    </span>
                    {nextTitle}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                </Link>
              ) : quizHref ? (
                <Link
                  href={quizHref}
                  className="ml-auto inline-flex items-center gap-2 text-right text-ink-soft hover:text-ink"
                >
                  <span>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                      Langkah berikutnya
                    </span>
                    Quiz akhir kursus
                  </span>
                  <FileQuestion className="size-3.5 shrink-0" aria-hidden="true" />
                </Link>
              ) : null}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, CircleAlert, FileQuestion } from "lucide-react";

import { QuizPlayer } from "@/components/quiz/quiz-player";
import { Callout } from "@/components/ui/callout";
import { requireProfile } from "@/lib/auth";
import { getCourseSummary } from "@/lib/data/courses";
import { getUserCourseState } from "@/lib/data/learning";
import { getSanitizedQuizForCourse } from "@/lib/data/quiz";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseSummary(slug);
  return {
    title: course ? `Quiz ${course.title}` : "Quiz tidak ditemukan",
    description: course ? `Quiz akhir untuk kursus ${course.title}.` : undefined,
  };
}

export default async function CourseQuizPage({ params }: PageProps) {
  const { slug } = await params;
  const { user } = await requireProfile(`/courses/${slug}/quiz`);

  const course = await getCourseSummary(slug);
  if (!course) notFound();

  if (!course.id) {
    return (
      <div className="container-lc py-12">
        <Callout tone="warning" title="Quiz belum tersedia">
          Data kursus belum terhubung ke database, jadi quiz belum bisa dikerjakan.{" "}
          <Link href={`/courses/${course.slug}`} className="font-medium text-accent-text">
            Kembali ke detail kursus
          </Link>
          .
        </Callout>
      </div>
    );
  }

  const [quiz, state] = await Promise.all([
    getSanitizedQuizForCourse(course.id),
    getUserCourseState(user.id, course.slug),
  ]);

  if (!quiz) {
    return (
      <div className="container-lc py-12">
        <Callout tone="warning" title="Quiz belum tersedia">
          Quiz untuk kursus ini belum dipublikasikan.{" "}
          <Link href={`/courses/${course.slug}`} className="font-medium text-accent-text">
            Kembali ke detail kursus
          </Link>
          .
        </Callout>
      </div>
    );
  }

  const allLessonsDone = state ? state.completedCount >= state.totalLessons : false;
  const passingScore = quiz.passingScore;
  const bestScore = state?.bestScore ?? null;
  const passed = bestScore !== null && bestScore >= passingScore;
  const certificate = state?.certificate ?? null;

  return (
    <div className="container-lc py-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/courses/${course.slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {course.title}
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          Quiz akhir kursus
        </span>
      </div>

      <header className="mt-5 max-w-3xl">
        <p className="eyebrow">Penilaian</p>
        <h1 className="display-section mt-2 text-[2rem] sm:text-[2.5rem]">{quiz.title}</h1>
        <p className="lead mt-3 text-base">{quiz.description}</p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
        <div className="rounded-[6px] border border-line bg-surface px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">Syarat quiz</p>
          <ul className="mt-2 space-y-1.5 text-xs text-ink-soft">
            <li className="flex items-start gap-2">
              {allLessonsDone ? (
                <Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden="true" />
              ) : (
                <CircleAlert
                  className="mt-0.5 size-3.5 shrink-0 text-highlight"
                  aria-hidden="true"
                />
              )}
              <span>
                Lesson selesai {state?.completedCount ?? 0}/{state?.totalLessons ?? course.lessons.length}
                {allLessonsDone ? " — lengkap" : " — quiz tetap bisa dikerjakan, sertifikat menunggu"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              {passed ? (
                <Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden="true" />
              ) : (
                <FileQuestion
                  className="mt-0.5 size-3.5 shrink-0 text-muted"
                  aria-hidden="true"
                />
              )}
              <span>
                Nilai minimal {passingScore}%
                {bestScore !== null ? ` — nilai terbaik ${bestScore}%` : " — belum ada nilai"}
              </span>
            </li>
          </ul>
        </div>
        <div className="rounded-[6px] border border-line bg-surface px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">Setelah lulus</p>
          {certificate ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Sertifikat kursus ini sudah terbit.{" "}
              <Link
                href={`/certificates/${certificate.certificateNumber}`}
                className="font-medium text-accent-text"
              >
                Buka sertifikat
              </Link>
              .
            </p>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-ink-soft">
              Jika semua lesson selesai dan nilaimu memenuhi syarat, sertifikat diterbitkan
              otomatis oleh server dan bisa diunduh sebagai PDF.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <QuizPlayer
          quiz={quiz}
          course={{ slug: course.slug, title: course.title }}
          initialAttempts={state?.attemptsCount ?? 0}
        />
      </div>
    </div>
  );
}

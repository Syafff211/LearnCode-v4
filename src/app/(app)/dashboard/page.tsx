import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Check,
  Code2,
  FileQuestion,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { requireProfile } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/learning";
import type { RecentActivity } from "@/lib/data/types";
import { formatDate, formatScore, formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
};

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()),
  );
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function todayLabel(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function ActivityRow({ activity }: { activity: RecentActivity }) {
  if (activity.type === "lesson_completed") {
    return (
      <li className="flex gap-3 py-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
          <Check className="size-3.5 text-ok" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-ink">
            <Link href={`/learn/${activity.lessonSlug}`} className="hover:underline">
              {activity.lessonTitle}
            </Link>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {activity.courseTitle} · {formatShortDate(activity.at)}
          </p>
        </div>
      </li>
    );
  }
  if (activity.type === "quiz_attempt") {
    return (
      <li className="flex gap-3 py-3">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
          <FileQuestion className="size-3.5 text-accent-text" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug text-ink">
            Quiz {activity.quizTitle} — {activity.score}%{" "}
            <span className={activity.passed ? "text-ok" : "text-highlight"}>
              ({activity.passed ? "lulus" : "belum lulus"})
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {activity.courseTitle} · {formatShortDate(activity.at)}
          </p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex gap-3 py-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface">
        <Award className="size-3.5 text-accent-text" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-ink">
          <Link href={`/certificates/${activity.certificateNumber}`} className="hover:underline">
            Sertifikat diterbitkan
          </Link>
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {activity.courseTitle} · {formatShortDate(activity.at)}
        </p>
      </div>
    </li>
  );
}

export default async function DashboardPage() {
  const { user, profile } = await requireProfile("/dashboard");
  const data = await getDashboardData(user.id);
  const firstName = (profile.full_name || user.email?.split("@")[0] || "Pelajar").split(" ")[0];
  const hasAnyProgress = data.inProgress.length > 0 || data.completed.length > 0;
  const activeCourses = data.inProgress;
  const recommendedCourse = data.recommended
    ? data.courses.find((course) => course.course.title === data.recommended?.context)
    : undefined;

  return (
    <div className="container-lc py-8 sm:py-10 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Dashboard · {todayLabel()}</p>
          <h1 className="display-section mt-2">
            {greeting()}, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-muted">
            {hasAnyProgress
              ? "Lanjutkan dari titik terakhir, atau buka lesson berikutnya."
              : "Belum ada progress. Mulai dari lesson pertama—tidak perlu menyiapkan apa pun."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/courses">
              <BookOpen aria-hidden="true" />
              Katalog kursus
            </Link>
          </Button>
        </div>
      </div>

      {!hasAnyProgress ? (
        <section className="mt-8 overflow-hidden rounded-[8px] border border-line bg-surface">
          <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
            <div className="p-6 sm:p-8">
              <p className="eyebrow">Mulai di sini</p>
              <h2 className="display-title mt-3 max-w-[22ch]">
                {data.recommended?.title ?? "Pilih kursus pertamamu"}
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
                {data.recommended
                  ? `${data.recommended.context} · mulai dari lesson pertama dan lanjutkan sesuai waktumu.`
                  : "Jelajahi katalog untuk memilih materi yang ingin kamu pelajari."}
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <Link href={data.recommended?.href ?? "/courses"}>
                    {data.recommended ? "Mulai lesson" : "Jelajahi kursus"}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/playground">Coba playground</Link>
                </Button>
              </div>
            </div>
            <div className="border-t border-line bg-surface-2/60 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <p className="eyebrow">Jalur yang disarankan</p>
              <ul className="mt-4 space-y-4">
                {data.courses.map((course, index) => (
                  <li key={course.course.slug}>
                    <Link
                      href={`/courses/${course.course.slug}`}
                      className="group flex items-start gap-3"
                    >
                      <span className="mt-0.5 font-mono text-[11px] text-muted">
                        0{index + 1}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-ink group-hover:text-accent-text">
                          {course.course.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {course.totalLessons} lesson · {course.course.level}
                        </span>
                      </span>
                      <ArrowUpRight className="size-3.5 text-muted transition-colors group-hover:text-accent-text" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                Progress dan hasil quiz tersimpan di akunmu; syarat sertifikat diperiksa di server.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {data.recommended ? (
            <section className="mt-8">
              <div className="rounded-[8px] border border-line bg-surface">
                <div className="border-b border-line px-5 py-3 sm:px-6">
                  <p className="eyebrow">Langkah berikutnya</p>
                </div>
                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
                  <div>
                    <p className="flex items-center gap-2 text-xs text-muted">
                      {data.recommended.kind === "quiz" ? (
                        <FileQuestion className="size-3.5" aria-hidden="true" />
                      ) : (
                        <BookOpen className="size-3.5" aria-hidden="true" />
                      )}
                      {data.recommended.context}
                    </p>
                    <h2 className="display-title mt-2 max-w-[28ch]">
                      {data.recommended.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted">
                      {data.recommended.reason === "quiz"
                        ? "Semua langkah belajar sudah tersedia. Selesaikan quiz untuk memenuhi syarat sertifikat."
                        : data.recommended.reason === "start"
                          ? "Belum ada progress di kursus ini. Mulai dari lesson pertama."
                          : "Lanjutkan dari titik terakhir yang tersimpan."}
                    </p>
                    <Button asChild className="mt-4">
                      <Link href={data.recommended.href}>
                        {data.recommended.kind === "quiz" ? "Buka quiz" : "Lanjutkan belajar"}
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                  {recommendedCourse ? (
                    <div className="rounded-[6px] border border-line bg-canvas p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-ink">{recommendedCourse.course.title}</p>
                        <span className="mono-meta">{recommendedCourse.percent}%</span>
                      </div>
                      <Progress value={recommendedCourse.percent} className="mt-2" />
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-muted">Lesson selesai</dt>
                          <dd className="mt-0.5 text-ink">
                            {recommendedCourse.completedCount}/{recommendedCourse.totalLessons}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">Nilai quiz</dt>
                          <dd className="mt-0.5 text-ink">{formatScore(recommendedCourse.bestScore)}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <section>
                <div className="flex items-end justify-between gap-4">
                  <h2 className="display-title">Kursus yang kamu pelajari</h2>
                  <span className="mono-meta">{activeCourses.length} aktif</span>
                </div>

                {activeCourses.length === 0 ? (
                  <div className="mt-4 rounded-[8px] border border-dashed border-line-strong p-6">
                    <p className="text-sm text-ink-soft">
                      Semua kursus yang dimulai sudah selesai. Lihat sertifikatmu
                      atau mulai kursus berikutnya.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-[8px] border border-line bg-surface">
                    {activeCourses.map((state, index) => {
                      const nextLesson =
                        state.course.lessons.find(
                          (lesson) => !state.completedLessonIds.includes(lesson.slug),
                        ) ?? state.course.lessons[0];
                      const allDone = state.completedCount >= state.totalLessons;
                      return (
                        <div
                          key={state.course.slug}
                          className={`p-5 sm:p-6 ${index > 0 ? "border-t border-line" : ""}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-[0.9375rem] font-medium text-ink">
                                  {state.course.title}
                                </h3>
                                <Badge variant="outline">{state.course.level}</Badge>
                                {state.bestScore !== null ? (
                                  <Badge variant={state.bestScore >= state.course.passingScore ? "success" : "warning"}>
                                    Quiz {state.bestScore}%
                                  </Badge>
                                ) : (
                                  <Badge variant="neutral">Quiz belum</Badge>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs text-muted">
                                {state.completedCount}/{state.totalLessons} lesson selesai
                                {state.lastActivityAt
                                  ? ` · terakhir ${formatShortDate(state.lastActivityAt)}`
                                  : ""}
                              </p>
                            </div>
                            <span className="mono-meta">{state.percent}%</span>
                          </div>
                          <Progress value={state.percent} className="mt-3" />
                          <div className="mt-4 flex flex-wrap gap-2">
                            {!allDone && nextLesson ? (
                              <Button asChild size="sm">
                                <Link href={`/learn/${nextLesson.slug}`}>
                                  Lanjutkan: {nextLesson.title}
                                  <ArrowRight aria-hidden="true" />
                                </Link>
                              </Button>
                            ) : (
                              <Button asChild size="sm">
                                <Link href={`/courses/${state.course.slug}/quiz`}>
                                  <FileQuestion aria-hidden="true" />
                                  {state.bestScore !== null ? "Tinjau quiz" : "Kerjakan quiz"}
                                </Link>
                              </Button>
                            )}
                            <Button asChild size="sm" variant="secondary">
                              <Link href={`/courses/${state.course.slug}`}>Lihat kursus</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {data.quizAwaiting.length > 0 ? (
                <section className="mt-8">
                  <h2 className="display-title">Menunggu quiz</h2>
                  <ul className="mt-3 border-t border-line">
                    {data.quizAwaiting.map((state) => (
                      <li
                        key={state.course.slug}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5"
                      >
                        <div>
                          <p className="text-sm text-ink">{state.course.title}</p>
                          <p className="mt-0.5 text-xs text-muted">
                            {state.completedCount}/{state.totalLessons} lesson selesai · nilai
                            minimal {state.course.passingScore}%
                          </p>
                        </div>
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/courses/${state.course.slug}/quiz`}>Kerjakan quiz</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {data.completed.length > 0 ? (
                <section className="mt-8">
                  <div className="flex items-end justify-between gap-4">
                    <h2 className="display-title">Kursus selesai</h2>
                    <Link
                      href="/dashboard/certificates"
                      className="text-xs text-accent-text underline-offset-2 hover:underline"
                    >
                      Semua sertifikat
                    </Link>
                  </div>
                  <ul className="mt-3 border-t border-line">
                    {data.completed.map((state) => (
                      <li
                        key={state.course.slug}
                        className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3.5"
                      >
                        <div>
                          <p className="flex items-center gap-2 text-sm text-ink">
                            <GraduationCap className="size-4 text-ok" aria-hidden="true" />
                            {state.course.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            Nilai akhir {formatScore(state.certificate?.finalScore)} ·{" "}
                            {state.certificate ? formatDate(state.certificate.issuedAt) : ""}
                          </p>
                        </div>
                        {state.certificate ? (
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/certificates/${state.certificate.certificateNumber}`}>
                              Lihat sertifikat
                            </Link>
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="space-y-8 lg:col-span-4">
              <section>
                <h2 className="display-title">Aktivitas terbaru</h2>
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {data.recentActivity.length === 0 ? (
                    <li className="py-4 text-sm text-muted">
                      Aktivitas akan muncul setelah kamu menandai lesson selesai
                      atau mengirim quiz.
                    </li>
                  ) : (
                    data.recentActivity.map((activity, index) => (
                      <ActivityRow
                        key={`${activity.type}-${activity.at}-${index}`}
                        activity={activity}
                      />
                    ))
                  )}
                </ul>
              </section>

              <section className="rounded-[8px] border border-line bg-surface p-5">
                <p className="eyebrow">Alat belajar</p>
                <ul className="mt-3 space-y-3">
                  <li>
                    <Link
                      href="/ai-tutor"
                      className="group flex items-start gap-3 rounded-[4px] p-1 -m-1 hover:bg-surface-2"
                    >
                      <Sparkles className="mt-0.5 size-4 text-accent-text" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-medium text-ink">AI Tutor</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          Tanya, debug, atau minta hint untuk lesson aktif.
                        </span>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/playground"
                      className="group flex items-start gap-3 rounded-[4px] p-1 -m-1 hover:bg-surface-2"
                    >
                      <Code2 className="mt-0.5 size-4 text-accent-text" aria-hidden="true" />
                      <span>
                        <span className="block text-sm font-medium text-ink">Playground</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          Eksperimen HTML, CSS, dan JavaScript di browser.
                        </span>
                      </span>
                    </Link>
                  </li>
                </ul>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="display-title">Sertifikat</h2>
                  <Award className="size-4 text-muted" aria-hidden="true" />
                </div>
                {data.certificates.length === 0 ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Belum ada sertifikat. Selesaikan seluruh lesson dan quiz
                    dengan nilai minimal kursus untuk menerbitkannya secara
                    otomatis.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-line border-y border-line">
                    {data.certificates.map((certificate) => (
                      <li key={certificate.certificateNumber} className="py-3">
                        <Link
                          href={`/certificates/${certificate.certificateNumber}`}
                          className="group flex items-center justify-between gap-3"
                        >
                          <span>
                            <span className="block text-sm text-ink group-hover:text-accent-text">
                              {certificate.courseTitle}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] text-muted">
                              {certificate.certificateNumber}
                            </span>
                          </span>
                          <ArrowUpRight className="size-3.5 text-muted" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

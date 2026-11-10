import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award, Check, ChevronRight, Clock, FileQuestion, Layers, Lock, Play } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Progress } from "@/components/ui/progress";
import { getSessionContext } from "@/lib/auth";
import { getCourseSummary } from "@/lib/data/courses";
import { getUserCourseState } from "@/lib/data/learning";
import { canonicalUrl } from "@/lib/seo";
import { formatDuration, formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseSummary(slug);
  if (!course) {
    return {
      title: "Kursus tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }
  const path = `/courses/${course.slug}`;
  return {
    title: course.title,
    description: course.description,
    alternates: { canonical: path },
    openGraph: {
      title: course.title,
      description: course.description,
      url: canonicalUrl(path),
      type: "website",
      siteName: "LearnCode",
      locale: "id_ID",
    },
    twitter: {
      card: "summary",
      title: course.title,
      description: course.description,
    },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseSummary(slug);
  if (!course) notFound();

  const session = await getSessionContext();
  const state = session ? await getUserCourseState(session.user.id, slug) : null;
  const completed = new Set(state?.completedLessonIds ?? []);
  const nextLesson = course.lessons.find((lesson) => !completed.has(lesson.slug)) ?? course.lessons[0];
  const allLessonsDone = state ? state.completedCount >= state.totalLessons : false;
  const quizPassed = Boolean(state && state.bestScore !== null && state.bestScore >= course.passingScore);
  const startHref = nextLesson ? `/learn/${nextLesson.slug}` : "/dashboard";
  const isDatabaseCourse = Boolean(course.id);
  const coursePath = `/courses/${course.slug}`;
  const breadcrumbItems = [
    { name: "Beranda", url: canonicalUrl("/") },
    { name: "Kursus", url: canonicalUrl("/courses") },
    { name: course.title, url: canonicalUrl(coursePath) },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Course",
              name: course.title,
              description: course.description,
              url: canonicalUrl(coursePath),
              inLanguage: "id-ID",
              ...(course.objectives.length > 0 ? { teaches: course.objectives } : {}),
              provider: {
                "@type": "Organization",
                name: "LearnCode",
                url: canonicalUrl("/"),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: breadcrumbItems.map((item, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: item.url,
              })),
            },
          ],
        }}
      />
      <section className="border-b border-line">
        <div className="container-lc py-9 sm:py-12">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <li><Link href="/" className="hover:text-ink">Beranda</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/courses" className="hover:text-ink">Kursus</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">{course.title}</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">Kursus {String(course.position).padStart(2, "0")}</Badge>
                <Badge variant="outline">{course.level}</Badge>
              </div>
              <h1 className="display-section mt-4 max-w-[18ch]">{course.title}</h1>
              <p className="lead mt-3 max-w-2xl">{course.tagline}</p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{course.description}</p>
              <dl className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ink-soft">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted" aria-hidden="true" />
                  <dt className="sr-only">Estimasi durasi</dt>
                  <dd>{formatDuration(course.durationMinutes)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-muted" aria-hidden="true" />
                  <dt className="sr-only">Jumlah lesson</dt>
                  <dd>{course.lessons.length} lesson</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="size-4 text-muted" aria-hidden="true" />
                  <dt className="sr-only">Passing score</dt>
                  <dd>Nilai minimal {course.passingScore}%</dd>
                </div>
              </dl>
            </div>

            <aside className="rounded-[8px] border border-line bg-surface p-5" aria-label="Progress dan langkah berikutnya">
              {state?.certificate ? (
                <>
                  <p className="flex items-center gap-2 text-sm font-medium text-ok">
                    <Check className="size-4" aria-hidden="true" />
                    Kursus selesai
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Nilai akhir {state.certificate.finalScore}% · diterbitkan {new Date(state.certificate.issuedAt).getFullYear()}.
                  </p>
                  <Button asChild className="mt-4 w-full">
                    <Link href={`/certificates/${state.certificate.certificateNumber}`}>Lihat sertifikat</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="eyebrow">{state ? "Progress kamu" : "Siap dimulai"}</p>
                  {state ? (
                    <>
                      <div className="mt-3 flex items-baseline justify-between">
                        <p className="font-display text-2xl text-ink">
                          {state.completedCount}<span className="text-base text-muted"> / {state.totalLessons} lesson</span>
                        </p>
                        <span className="mono-meta">{state.percent}%</span>
                      </div>
                      <Progress value={state.percent} className="mt-2" label="Progress kursus" />
                      <p className="mt-3 text-xs text-muted">
                        {quizPassed
                          ? `Quiz lulus · ${formatScore(state.bestScore)}.`
                          : state.attemptsCount > 0
                            ? `Nilai quiz terbaik ${formatScore(state.bestScore)}.`
                            : "Quiz belum dikerjakan."}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      Masuk untuk menyimpan progress, mengerjakan quiz, dan melihat syarat kelulusan.
                    </p>
                  )}
                  <Button asChild className="mt-4 w-full">
                    <Link href={session ? startHref : `/register?next=/courses/${course.slug}`}>
                      <Play aria-hidden="true" />
                      {state && state.completedCount > 0 ? "Lanjutkan kursus" : "Mulai kursus"}
                    </Link>
                  </Button>
                  {state && allLessonsDone ? (
                    <Button asChild variant="secondary" className="mt-2 w-full">
                      <Link href={`/courses/${course.slug}/quiz`}>
                        <FileQuestion aria-hidden="true" />
                        {quizPassed ? "Tinjau quiz" : "Kerjakan quiz"}
                      </Link>
                    </Button>
                  ) : null}
                  {!session ? (
                    <p className="mt-3 text-center text-xs text-muted">
                      Sudah punya akun? <Link href={`/login?next=/courses/${course.slug}`} className="text-accent-text hover:underline">Masuk</Link>
                    </p>
                  ) : null}
                </>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className="container-lc py-10 sm:py-14">
        {!isDatabaseCourse ? (
          <Callout tone="warning" title="Progress belum tersedia">
            Kursus ini masih tampil dari katalog konten. Jalankan migration dan seed Supabase untuk mengaktifkan progress, quiz, dan sertifikat.
          </Callout>
        ) : null}

        <div className="mt-8 max-w-4xl">
          <section aria-labelledby="objectives-heading">
            <p className="eyebrow">Materi</p>
            <h2 id="objectives-heading" className="display-title mt-2">Yang akan kamu pelajari</h2>
            {course.objectives.length > 0 ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {course.objectives.map((objective) => (
                  <li key={objective} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
                    {objective}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">Tujuan pembelajaran akan ditambahkan pada kursus ini.</p>
            )}
          </section>

          <section className="mt-10" aria-labelledby="curriculum-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Kurikulum</p>
                <h2 id="curriculum-heading" className="display-title mt-2">Lesson dan quiz</h2>
              </div>
              {state ? <span className="mono-meta">{state.completedCount}/{state.totalLessons} selesai</span> : null}
            </div>

            <ol className="mt-4 border-t border-line">
              {course.lessons.map((lesson, index) => {
                const done = completed.has(lesson.slug);
                return (
                  <li key={lesson.slug} className="border-b border-line">
                    <Link
                      href={`/learn/${lesson.slug}`}
                      className="group flex items-start gap-4 py-4 transition-colors hover:bg-surface-2/60 sm:items-center sm:gap-5 sm:px-2 motion-reduce:transition-none"
                    >
                      <span
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] sm:mt-0 ${done ? "border-ok/30 bg-ok-soft text-ok" : "border-line-strong bg-surface text-muted"}`}
                        aria-hidden="true"
                      >
                        {done ? <Check className="size-3" /> : String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[0.9375rem] font-medium text-ink">{lesson.title}</span>
                          {done ? <Badge variant="success">Selesai</Badge> : null}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted">{lesson.summary}</span>
                      </span>
                      <span className="hidden shrink-0 items-center gap-3 text-xs text-muted sm:flex">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {lesson.estimatedMinutes} menit
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
              <li className="border-b border-line">
                <Link
                  href={`/courses/${course.slug}/quiz`}
                  className="group flex items-start gap-4 py-4 transition-colors hover:bg-surface-2/60 sm:items-center sm:gap-5 sm:px-2 motion-reduce:transition-none"
                >
                  <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border sm:mt-0 ${quizPassed ? "border-ok/30 bg-ok-soft text-ok" : "border-line-strong bg-surface-2 text-accent-text"}`} aria-hidden="true">
                    {quizPassed ? <Check className="size-3" /> : <FileQuestion className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.9375rem] font-medium text-ink">Quiz akhir kursus</span>
                      <Badge variant="outline">Passing {course.passingScore}%</Badge>
                      {quizPassed ? <Badge variant="success">Lulus</Badge> : null}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">Diperiksa di server dengan umpan balik per pertanyaan.</span>
                  </span>
                  <ChevronRight className="hidden size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
                </Link>
              </li>
            </ol>
          </section>

          <section className="mt-10 border-t border-line pt-7" aria-labelledby="certificate-heading">
            <p className="eyebrow">Sertifikat</p>
            <h2 id="certificate-heading" className="display-title mt-2">Syarat penerbitan</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                `Selesaikan lesson wajib (${course.lessons.filter((lesson) => lesson.required !== false).length}).`,
                "Kerjakan quiz akhir kursus.",
                `Capai nilai minimal ${course.passingScore}%.`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 rounded-[6px] border border-line bg-surface p-3 text-xs leading-relaxed text-ink-soft">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Progress dan hasil quiz yang tersimpan diperiksa server sebelum sertifikat diterbitkan.
            </p>
          </section>
        </div>
      </section>
    </>
  );
}

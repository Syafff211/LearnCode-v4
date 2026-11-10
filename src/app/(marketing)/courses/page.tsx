import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, Code2, Layers } from "lucide-react";

import { CourseCard } from "@/components/marketing/course-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getCatalogCourses } from "@/lib/data/courses";
import { canonicalUrl } from "@/lib/seo";
import { formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog kursus",
  description:
    "Kursus HTML, CSS, dan JavaScript dengan lesson praktik, quiz, dan sertifikat yang dapat diverifikasi.",
  alternates: { canonical: "/courses" },
  openGraph: {
    title: "Katalog kursus LearnCode",
    description:
      "Kursus HTML, CSS, dan JavaScript dengan lesson praktik, quiz, dan sertifikat yang dapat diverifikasi.",
    url: "/courses",
    type: "website",
    siteName: "LearnCode",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "Katalog kursus LearnCode",
    description:
      "Kursus HTML, CSS, dan JavaScript dengan lesson praktik, quiz, dan sertifikat yang dapat diverifikasi.",
  },
};

export default async function CoursesPage() {
  const courses = await getCatalogCourses();
  const totalLessons = courses.reduce((total, course) => total + course.lessons.length, 0);
  const totalMinutes = courses.reduce(
    (total, course) => total + course.durationMinutes,
    0,
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Katalog kursus LearnCode",
          itemListElement: courses.map((course, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Course",
              name: course.title,
              description: course.description,
              url: canonicalUrl(`/courses/${course.slug}`),
              provider: { "@type": "Organization", name: "LearnCode", url: canonicalUrl("/") },
            },
          })),
        }}
      />
      <section className="border-b border-line">
        <div className="container-lc py-12 sm:py-16 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <nav aria-label="Breadcrumb" className="mb-5">
                <ol className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                  <li>
                    <Link href="/" className="hover:text-ink">
                      Beranda
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="text-ink">
                    Kursus
                  </li>
                </ol>
              </nav>
              <p className="eyebrow">Katalog kursus</p>
              <h1 className="display-section mt-4 max-w-[22ch]">
                Mulai dari fondasi yang benar-benar kamu pakai.
              </h1>
              <p className="lead mt-5 max-w-2xl">
                Tiga kursus inti untuk membangun dasar frontend: struktur,
                tampilan, lalu interaksi. Setiap lesson memiliki materi, contoh
                kode, latihan, dan checkpoint quiz.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-4 border-t border-line pt-5 lg:col-span-4 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <div>
                <dt className="eyebrow">Kursus</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{courses.length}</dd>
              </div>
              <div>
                <dt className="eyebrow">Lesson</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{totalLessons}</dd>
              </div>
              <div>
                <dt className="eyebrow">Estimasi</dt>
                <dd className="mt-1 font-display text-2xl text-ink">
                  {Math.round(totalMinutes / 60)}<span className="text-base text-muted"> jam</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="container-lc py-10 sm:py-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Layers className="size-4" aria-hidden="true" />
            Jalur yang disarankan: HTML → CSS → JavaScript
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
            {formatDuration(totalMinutes)} total materi
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="container-lc py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">Cara memilih kursus</p>
              <h2 className="display-title mt-3 max-w-[16ch]">
                Ikuti urutan, atau mulai dari yang paling kamu butuhkan.
              </h2>
            </div>
            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:col-span-8">
              {[
                {
                  icon: Code2,
                  title: "Baru mulai dari nol",
                  body: "Ambil HTML Fundamentals lebih dulu. Kamu akan menulis struktur halaman sebelum menyentuh CSS.",
                },
                {
                  icon: Clock,
                  title: "Belajar 20–30 menit sehari",
                  body: "Satu lesson per sesi sudah cukup. Progress dan hasil quiz tersimpan sehingga kamu bisa berhenti kapan saja.",
                },
                {
                  icon: Layers,
                  title: "Sudah familiar dengan HTML",
                  body: "Buka CSS Fundamentals dan kerjakan quiz-nya untuk mengukur pemahaman. Setiap lesson tetap bisa diikuti secara mandiri.",
                },
                {
                  icon: ArrowRight,
                  title: "Siap mengejar sertifikat",
                  body: "Selesaikan seluruh lesson lalu kerjakan quiz. Nilai minimal kursus ditentukan per kursus dan diperiksa ulang di server.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-medium text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

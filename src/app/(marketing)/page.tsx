import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Code2, Play, Sparkles } from "lucide-react";

import type { Metadata } from "next";

import { CourseCard } from "@/components/marketing/course-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { getCatalogCourses } from "@/lib/data/courses";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Belajar Coding dengan Praktik",
  description:
    "Belajar HTML, CSS, dan JavaScript lewat materi praktik, playground kode, quiz, dan AI Tutor.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Belajar Coding dengan Praktik",
    description:
      "Belajar HTML, CSS, dan JavaScript lewat materi praktik, playground kode, quiz, dan AI Tutor.",
    url: "/",
    type: "website",
    siteName: "LearnCode",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "Belajar Coding dengan Praktik",
    description:
      "Belajar HTML, CSS, dan JavaScript lewat materi praktik, playground kode, quiz, dan AI Tutor.",
  },
};

const previewDocument = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f4f2eb; font: 15px/1.6 system-ui, sans-serif; color: #27251f; }
    main { width: min(100%, 330px); padding: 26px; border: 1px solid #d9d5c9; border-radius: 12px; background: #fffefa; box-shadow: 0 14px 36px rgb(39 37 31 / 8%); }
    .tag { margin: 0 0 12px; color: #7b6d3e; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; font-size: 28px; letter-spacing: -.04em; }
    a { display: inline-block; padding: 9px 13px; border-radius: 6px; background: #c5a84a; color: #211e16; font-weight: 600; text-decoration: none; }
  </style>
</head>
<body>
  <main class="card">
    <p class="tag">HTML · CSS</p>
    <h1>Halo, web.</h1>
    <a href="#materi">Lihat materi</a>
  </main>
</body>
</html>`;

export default async function LandingPage() {
  const courses = await getCatalogCourses();
  const featured = courses.slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${canonicalUrl("/")}#organization`,
              name: "LearnCode",
              url: canonicalUrl("/"),
            },
            {
              "@type": "WebSite",
              "@id": `${canonicalUrl("/")}#website`,
              name: "LearnCode",
              url: canonicalUrl("/"),
              inLanguage: "id-ID",
              publisher: { "@id": `${canonicalUrl("/")}#organization` },
            },
          ],
        }}
      />
      <section className="border-b border-line">
        <div className="container-lc grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_0.92fr] lg:gap-14 lg:py-20">
          <div>
            <h1 className="display-hero mt-0 max-w-[15ch]">
              Belajar coding dengan membangun sesuatu.
            </h1>
            <p className="lead mt-5 max-w-[46ch]">
              Belajar HTML, CSS, dan JavaScript lewat praktik.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="justify-center">
                <Link href="/register">
                  Mulai Belajar
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="justify-center">
                <Link href="#kursus">Lihat kursus</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-5 sm:p-6">
            <p className="eyebrow">Alur belajar</p>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              <li className="flex items-center gap-3 py-4">
                <BookOpen className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">Pahami</span>
              </li>
              <li className="flex items-center gap-3 py-4">
                <Code2 className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">Praktik</span>
              </li>
              <li className="flex items-center gap-3 py-4">
                <CheckCircle2 className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
                <span className="text-sm font-medium text-ink">Lanjutkan</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section id="kursus" className="scroll-mt-20 border-b border-line">
        <div className="container-lc py-12 sm:py-16 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="display-section mt-0 max-w-[18ch]">Pilih kursus</h2>
            </div>
            <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-text hover:underline">
              Semua kursus
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((course) => <CourseCard key={course.slug} course={course} compact />)}
            </div>
          ) : (
            <p className="mt-6 rounded-[8px] border border-dashed border-line-strong p-6 text-sm text-muted">
              Belum ada kursus.
            </p>
          )}
        </div>
      </section>

      <section id="praktik" className="border-b border-line bg-surface-2/40">
        <div className="container-lc grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-12 lg:py-20">
          <div>
            <h2 className="display-section mt-0 max-w-[15ch]">Tulis kode. Lihat hasil.</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Coba langsung di browser.
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link href="/playground">
                <Play aria-hidden="true" />
                Buka playground
              </Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-[8px] border border-line bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">Pratinjau kode</p>
              <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">HTML + CSS</span>
            </div>
            <div className="grid sm:grid-cols-[0.78fr_1.22fr]">
              <pre className="min-w-0 overflow-x-auto border-b border-line bg-[#211f1a] p-4 font-mono text-[10px] leading-[1.8] text-[#e9e4d8] sm:border-b-0 sm:border-r sm:border-line sm:text-[11px]"><code>{`<main class="card">\n  <p class="tag">HTML · CSS</p>\n  <h1>Halo, web.</h1>\n  <a href="#materi">Lihat materi</a>\n</main>`}</code></pre>
              <div className="min-w-0 p-3 sm:p-4">
                <iframe
                  title="Pratinjau hasil halaman HTML dan CSS"
                  loading="lazy"
                  sandbox=""
                  srcDoc={previewDocument}
                  className="h-[280px] w-full rounded-[5px] border border-line bg-[#f4f2eb] sm:h-[340px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="container-lc grid gap-6 py-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface">
              <Sparkles className="size-4 text-accent-text" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">AI Tutor</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                Tanya kode atau minta petunjuk. AI tidak menjalankan kode.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link href="/ai-tutor">
              Buka AI Tutor
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

    </>
  );
}

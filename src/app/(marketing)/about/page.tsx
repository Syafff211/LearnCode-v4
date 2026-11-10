import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Code2, Sparkles } from "lucide-react";

import { PageBreadcrumbs } from "@/components/marketing/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { canonicalUrl } from "@/lib/seo";

const title = "Tentang LearnCode — Platform Belajar Coding Online";
const description =
  "Kenali LearnCode, platform belajar coding online untuk pemula dengan materi HTML, CSS, JavaScript, praktik coding, quiz, dan AI Tutor.";
const pageUrl = canonicalUrl("/about");

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: pageUrl },
  openGraph: {
    title,
    description,
    url: pageUrl,
    type: "website",
    siteName: "LearnCode",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const learningSteps = [
  {
    number: "01",
    title: "Pelajari konsepnya",
    description:
      "Materi disusun bertahap agar istilah dan konsep dasar lebih mudah diikuti sebelum masuk ke bagian berikutnya.",
    Icon: BookOpen,
  },
  {
    number: "02",
    title: "Praktik menulis kode",
    description:
      "Coba contoh dan latihan HTML, CSS, atau JavaScript. Playground membantu melihat hasil kode langsung di browser.",
    Icon: Code2,
  },
  {
    number: "03",
    title: "Periksa pemahaman",
    description:
      "Quiz memberi kesempatan untuk menguji pemahaman materi. Hasil dan progres tersimpan di akun saat Anda masuk.",
    Icon: CheckCircle2,
  },
  {
    number: "04",
    title: "Minta bantuan AI Tutor",
    description:
      "Ajukan pertanyaan tentang materi atau kode untuk mendapatkan penjelasan dan petunjuk tambahan.",
    Icon: Sparkles,
  },
];

export default function AboutPage() {
  return (
    <div className="container-lc py-8 sm:py-12 lg:py-14">
      <article className="mx-auto max-w-5xl">
        <PageBreadcrumbs label="Tentang LearnCode" path="/about" />

        <header className="mt-8 max-w-3xl border-b border-line pb-8 sm:pb-10">
          <p className="eyebrow">Tentang platform</p>
          <h1 className="display-section mt-2">Tentang LearnCode</h1>
          <p className="lead mt-4 max-w-2xl">
            LearnCode adalah platform belajar coding online untuk pemula. Di sini, Anda dapat
            mempelajari HTML, CSS, dan JavaScript melalui materi bertahap, praktik coding, quiz,
            serta bantuan AI Tutor.
          </p>
        </header>

        <div className="mx-auto max-w-3xl">
          <section aria-labelledby="tujuan" className="border-b border-line py-8 sm:py-10">
            <h2 id="tujuan" className="display-title">
              Visi dan tujuan: belajar dari dasar, dengan praktik
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-ink-soft">
              <p>
                Tujuan LearnCode adalah membantu langkah awal belajar pemrograman terasa lebih
                terarah: pahami satu konsep, coba sendiri, lalu lihat kembali bagian yang belum
                jelas. Materi dan latihan dirancang untuk dipelajari secara bertahap, tanpa
                mengharuskan Anda sudah pernah menulis kode sebelumnya.
              </p>
              <p>
                LearnCode berfokus pada dasar pembuatan web. HTML digunakan untuk menyusun isi
                halaman, CSS untuk mengatur tampilan, dan JavaScript untuk menambahkan interaksi.
                Anda dapat mengikuti urutan tersebut atau memilih materi yang ingin dipelajari
                terlebih dahulu.
              </p>
            </div>
          </section>

          <section aria-labelledby="cara-belajar" className="border-b border-line py-8 sm:py-10">
            <p className="eyebrow">Alur belajar</p>
            <h2 id="cara-belajar" className="display-title mt-2">
              Materi, praktik, quiz, lalu bertanya
            </h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {learningSteps.map(({ number, title: stepTitle, description: stepDescription, Icon }) => (
                <li
                  key={number}
                  className="rounded-[8px] border border-line bg-surface p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface-2 text-accent-text">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.08em] text-muted">
                      {number}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{stepTitle}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{stepDescription}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs leading-6 text-muted">
              AI Tutor membantu menjelaskan, tetapi jawabannya bisa saja kurang tepat. Periksa
              kembali penjelasan dan jalankan kode Anda untuk memastikan hasilnya.
            </p>
          </section>

          <section aria-labelledby="mulai" className="py-8 sm:py-10">
            <h2 id="mulai" className="display-title">
              Mulai sesuai langkah Anda
            </h2>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              Jika baru mengenal coding, Anda bisa mulai dari HTML, lanjut ke CSS, lalu mencoba
              JavaScript. Baca materi, kerjakan latihan, dan ulangi bagian yang ingin dipahami
              lebih baik. Blog LearnCode juga memuat bacaan seputar belajar pemrograman.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/courses">
                  Jelajahi kursus
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/blog">Baca blog</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Kembali ke beranda</Link>
              </Button>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}

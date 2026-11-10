import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, Code2, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const points = [
  {
    icon: BookOpen,
    title: "Materi yang benar-benar ditulis",
    body: "Tiga kursus inti dengan 13 lesson praktik dan contoh kode nyata.",
  },
  {
    icon: Code2,
    title: "Langsung praktik di browser",
    body: "Editor Monaco, preview tersandbox, dan console untuk membaca error.",
  },
  {
    icon: ShieldCheck,
    title: "Progress dan sertifikat terverifikasi",
    body: "Kemajuan tersimpan di akunmu dan sertifikat dapat diperiksa publik.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="container-lc flex h-15 items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <div className="container-lc grid min-h-[calc(100dvh-3.75rem)] lg:grid-cols-12">
          <div className="flex items-start justify-center py-10 sm:py-14 lg:col-span-7 lg:justify-start lg:py-20 xl:pl-8">
            <div className="w-full max-w-[27rem]">{children}</div>
          </div>

          <aside className="hidden border-l border-line lg:col-span-5 lg:block">
            <div className="pl-10 pt-20 xl:pl-14">
              <p className="eyebrow">Learn by doing</p>
              <h2 className="display-title mt-3 max-w-[18ch]">
                Tempat latihan yang tidak menghakimi kesalahan.
              </h2>
              <ul className="mt-8 space-y-5">
                {points.map((point) => (
                  <li key={point.title} className="flex gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-line bg-surface">
                      <point.icon className="size-3.5 text-accent-text" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">{point.title}</p>
                      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">
                        {point.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-10 max-w-sm rounded-[6px] border border-line bg-code-bg p-4">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  <Check className="size-3 text-ok" aria-hidden="true" />
                  progress tersimpan
                </p>
                <pre className="mt-2 overflow-x-auto font-mono text-[11px] leading-relaxed text-ink-soft">
                  <code>{`lesson_progress = {
  lesson: "teks-tautan-gambar",
  status: "selesai",
  next: "formulir-aksesibilitas"
}`}</code>
                </pre>
              </div>

              <p className="mt-8 max-w-sm text-xs leading-relaxed text-muted">
                Sertifikat LearnCode adalah bukti penyelesaian kursus, bukan
                akreditasi lembaga eksternal.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";

import { LogoMark } from "@/components/logo";

const productLinks = [
  { href: "/courses", label: "Kursus" },
  { href: "/blog", label: "Blog" },
  { href: "/playground", label: "Playground" },
  { href: "/ai-tutor", label: "AI Tutor" },
];

const accountLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Masuk" },
  { href: "/register", label: "Buat akun" },
];

const informationLinks = [
  { href: "/about", label: "Tentang LearnCode" },
  { href: "/privacy", label: "Kebijakan Privasi" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="container-lc py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.85fr_0.85fr_0.95fr] lg:gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <LogoMark className="size-6" />
              <span className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
                LearnCode
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Belajar pemrograman dengan membangun sesuatu. Materi praktik,
              latihan interaktif, dan AI Tutor yang menjelaskan alasan di balik
              kode.
            </p>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              Learn by doing. Understand with AI.
            </p>
          </div>

          <nav aria-label="Produk">
            <p className="eyebrow">Platform</p>
            <ul className="mt-3 space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Akun">
            <p className="eyebrow">Akun</p>
            <ul className="mt-3 space-y-2.5">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Informasi">
            <p className="eyebrow">Informasi</p>
            <ul className="mt-3 space-y-2.5">
              {informationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} LearnCode. Sertifikat LearnCode adalah
            bukti penyelesaian kursus di platform ini.
          </p>
          <p className="mono-meta">HTML · CSS · JavaScript</p>
        </div>
      </div>
    </footer>
  );
}

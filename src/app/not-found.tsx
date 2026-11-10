import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="container-lc flex h-15 items-center">
          <Logo />
        </div>
      </header>
      <main id="main-content" className="container-lc flex flex-1 items-center py-16">
        <div className="max-w-xl">
          <p className="eyebrow">Error 404</p>
          <h1 className="display-section mt-4">Halaman yang kamu cari tidak tersedia.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Tautan mungkin sudah berubah atau halaman tidak pernah ada. Kamu bisa
            kembali ke beranda atau melihat daftar kursus yang tersedia.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/">Kembali ke beranda</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/courses">Jelajahi kursus</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

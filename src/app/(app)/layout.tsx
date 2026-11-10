import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { getProfile, getSessionContext } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Learning shell. When an admin turns on maintenance mode, non-admin visitors
 * get a clear notice instead of the learning area; admins keep access so they
 * can finish maintenance and switch it back off.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const platform = await getPlatformSettings();

  if (platform.maintenanceMode) {
    const session = await getSessionContext();
    const profile = session ? await getProfile(session.user.id) : null;
    const isAdmin = profile?.role === "admin" && !profile.suspended_at;

    if (!isAdmin) {
      return (
        <div className="flex min-h-dvh flex-col">
          <header className="border-b border-line px-5 py-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <LogoMark className="size-6" />
              <span className="font-display text-lg font-semibold text-ink">LearnCode</span>
            </Link>
          </header>
          <main id="main-content" className="flex flex-1 items-start justify-center px-5 py-16">
            <div className="w-full max-w-lg rounded-[8px] border border-line bg-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-highlight-soft">
                <Wrench className="size-4 text-highlight" aria-hidden="true" />
              </span>
              <h1 className="mt-4 font-display text-xl font-semibold text-ink">
                {platform.platformName} sedang dalam pemeliharaan
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {platform.maintenanceMessage ||
                  "Area belajar ditutup sementara untuk perbaikan. Progress, quiz, dan sertifikatmu tetap tersimpan."}
              </p>
              {platform.contactEmail ? (
                <p className="mt-3 text-sm text-muted">
                  Butuh bantuan? Hubungi{" "}
                  <a href={`mailto:${platform.contactEmail}`} className="text-accent-text hover:underline">
                    {platform.contactEmail}
                  </a>
                  .
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/">Kembali ke beranda</Link>
                </Button>
                {session ? (
                  <form action={signOutAction}>
                    <Button type="submit" variant="ghost" size="sm">
                      Keluar
                    </Button>
                  </form>
                ) : (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Masuk</Link>
                  </Button>
                )}
              </div>
              {session ? (
                <p className="mt-4 text-[11px] leading-relaxed text-muted">
                  Halaman ini muncul karena administrator mengaktifkan mode pemeliharaan di
                  pengaturan platform.
                </p>
              ) : null}
            </div>
          </main>
        </div>
      );
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader variant="app" />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}

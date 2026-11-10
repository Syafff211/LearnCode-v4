import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";

import { AdminLoginForm } from "@/app/(admin-auth)/admin/admin-login-form";
import { SetupNotice } from "@/components/auth/setup-notice";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getAdminAuthState } from "@/lib/admin/auth";
import { signOutAction } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel admin",
  description: "Masuk ke panel administrasi LearnCode.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; status?: string }>;
}) {
  const params = await searchParams;
  const state = await getAdminAuthState();

  if (state.status === "ok") redirect("/admin/dashboard");

  const denied = params.denied === "1";

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line px-5 py-4 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <LogoMark className="size-6" />
          <span className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">
            LearnCode
          </span>
          <span className="rounded-[3px] border border-line-strong px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            Admin
          </span>
        </Link>
      </header>

      <main id="main-content" className="flex flex-1 items-start justify-center px-5 py-10 sm:py-16">
        <div className="w-full max-w-[26rem]">
          {state.status === "forbidden" || denied ? (
            <div className="rounded-[8px] border border-line bg-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-danger-soft">
                <ShieldAlert className="size-5 text-danger" aria-hidden="true" />
              </span>
              <h1 className="mt-4 font-display text-xl font-semibold text-ink">
                Akun ini tidak punya akses admin
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Panel admin hanya terbuka untuk akun yang perannya sudah diatur
                sebagai <span className="font-mono text-ink-soft">admin</span> oleh
                pemilik project melalui database. Login biasa tidak pernah
                menaikkan peran akun.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard">Kembali ke dashboard belajar</Link>
                </Button>
                <form action={signOutAction}>
                  <Button type="submit" variant="ghost" size="sm">
                    Keluar dari akun ini
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-[8px] border border-line bg-surface p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft">
                <ShieldCheck className="size-5 text-accent-text" aria-hidden="true" />
              </span>
              <p className="eyebrow mt-4">Akses terbatas</p>
              <h1 className="mt-1.5 font-display text-[1.4rem] font-semibold leading-tight tracking-[-0.02em] text-ink">
                Masuk ke panel admin
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Sesi diverifikasi ulang di server pada setiap halaman dan setiap
                aksi. Peran akun dibaca dari database, bukan dari browser.
              </p>

              <div className="mt-6 space-y-4">
                {!isSupabaseConfigured() ? <SetupNotice /> : null}
                {state.status === "unavailable" ? (
                  <div role="alert" className="rounded-[6px] border border-highlight/25 bg-highlight-soft px-3 py-2.5 text-[0.8125rem] text-ink-soft">
                    Panel admin belum siap: konfigurasi Supabase atau service role
                    belum lengkap di environment server.
                  </div>
                ) : null}
                <AdminLoginForm />
              </div>

              <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
                Belum ada akun admin? Buat akun biasa lewat halaman daftar, lalu
                jalankan prosedur bootstrap SQL di README sebagai pemilik project.
                Tidak ada endpoint publik yang bisa memberi peran admin.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

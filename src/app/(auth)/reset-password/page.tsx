import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form";
import { Callout } from "@/components/ui/callout";
import { getSessionContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Atur password baru",
  description: "Atur password baru untuk akun LearnCode.",
};

export default async function ResetPasswordPage() {
  const session = await getSessionContext();

  return (
    <>
      <p className="eyebrow">Keamanan akun</p>
      <h1 className="display-title mt-3">Atur password baru</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Pilih password yang kuat dan belum pernah kamu pakai di layanan lain.
      </p>

      <div className="mt-7 space-y-4">
        {!session ? (
          <>
            <Callout tone="warning" title="Sesi reset tidak ditemukan">
              Tautan reset password mungkin sudah kedaluwarsa atau belum dibuka.
              Ajukan tautan baru dari halaman lupa password, lalu buka tautan
              tersebut dari email.
            </Callout>
            <Link
              href="/forgot-password"
              className="inline-flex text-sm font-medium text-accent-text underline-offset-2 hover:underline"
            >
              Minta tautan reset baru
            </Link>
          </>
        ) : (
          <ResetPasswordForm />
        )}
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="text-accent-text underline-offset-2 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>

      {!isSupabaseConfigured() ? (
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Catatan: Supabase belum dikonfigurasi pada environment ini.
        </p>
      ) : null}
    </>
  );
}

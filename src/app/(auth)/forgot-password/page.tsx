import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/forgot-password-form";
import { SetupNotice } from "@/components/auth/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lupa password",
  description: "Minta tautan untuk mengatur ulang password akun LearnCode.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <p className="eyebrow">Pemulihan akun</p>
      <h1 className="display-title mt-3">Lupa password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Masukkan email yang kamu pakai untuk mendaftar. Kami akan mengirim
        tautan untuk mengatur password baru.
      </p>

      <div className="mt-7 space-y-4">
        {!isSupabaseConfigured() ? <SetupNotice /> : null}
        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Ingat password?{" "}
        <Link href="/login" className="font-medium text-accent-text underline-offset-2 hover:underline">
          Kembali masuk
        </Link>
      </p>
    </>
  );
}

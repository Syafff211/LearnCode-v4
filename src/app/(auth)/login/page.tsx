import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/(auth)/login/login-form";
import { SetupNotice } from "@/components/auth/setup-notice";
import { getSessionContext } from "@/lib/auth";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun LearnCode untuk melanjutkan lesson dan melihat progress.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next, "/dashboard");
  const session = await getSessionContext();
  if (session) redirect(next);

  const urlMessage =
    params.error === "auth_callback"
      ? "Tautan autentikasi tidak valid atau sudah kedaluwarsa. Coba masuk kembali."
      : params.error === "session_expired"
        ? "Sesi kamu berakhir. Silakan masuk kembali untuk melanjutkan."
        : params.error === "profile_missing"
          ? "Profil akun belum tersedia. Hubungi administrator atau coba masuk kembali."
          : params.error === "suspended"
            ? "Akun ini sedang dinonaktifkan oleh administrator, jadi akses ke LearnCode ditutup sementara."
            : undefined;

  return (
    <>
      <p className="eyebrow">Selamat datang kembali</p>
      <h1 className="display-title mt-3">Masuk ke LearnCode</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Lanjutkan lesson terakhir dan simpan progress belajarmu.
      </p>

      <div className="mt-7 space-y-4">
        {!isSupabaseConfigured() ? <SetupNotice /> : null}
        {urlMessage ? (
          <div
            role="alert"
            className="rounded-[6px] border border-danger/30 bg-danger-soft px-3.5 py-3 text-[13px] text-ink-soft"
          >
            {urlMessage}
          </div>
        ) : null}
        <LoginForm
          next={next}
          googleRedirectTo={isSupabaseConfigured() ? getAuthCallbackUrl(next) : null}
        />
      </div>
    </>
  );
}

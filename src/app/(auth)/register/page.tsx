import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/app/(auth)/register/register-form";
import { SetupNotice } from "@/components/auth/setup-notice";
import { getSessionContext } from "@/lib/auth";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buat akun",
  description:
    "Buat akun LearnCode untuk menyimpan progress, mengerjakan quiz, dan memperoleh sertifikat.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next, "/dashboard");
  const session = await getSessionContext();
  if (session) redirect(next);

  return (
    <>
      <p className="eyebrow">Akun baru</p>
      <h1 className="display-title mt-3">Mulai belajar dengan praktik</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Buat akun untuk menyimpan progress, mengerjakan quiz, dan memperoleh
        sertifikat setelah menyelesaikan kursus.
      </p>

      <div className="mt-7 space-y-4">
        {!isSupabaseConfigured() ? <SetupNotice /> : null}
        <RegisterForm
          next={next}
          googleRedirectTo={isSupabaseConfigured() ? getAuthCallbackUrl(next) : null}
        />
      </div>
    </>
  );
}

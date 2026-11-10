"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleCheck, MailCheck } from "lucide-react";

import { FormField, FormMessage, PasswordInput } from "@/components/auth/form-parts";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resendSignupOtpAction,
  signUpAction,
  verifySignUpOtpAction,
  type AuthActionState,
} from "@/lib/actions/auth";

const initialState: AuthActionState = { status: "idle" };

export function RegisterForm({
  next,
  googleRedirectTo,
}: {
  next: string;
  googleRedirectTo: string | null;
}) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifySignUpOtpAction,
    initialState,
  );
  const [resendState, resendAction, resendPending] = useActionState(
    resendSignupOtpAction,
    initialState,
  );
  const errors = state.fieldErrors ?? {};
  const verifyErrors = verifyState.fieldErrors ?? {};
  const email = state.email ?? "";
  const safeNext = state.next ?? next;
  const completedNext = verifyState.next ?? safeNext;

  if (state.status === "verify-email") {
    if (verifyState.status === "success") {
      return (
        <div className="rounded-[8px] border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-ok">
            <CircleCheck className="size-4" aria-hidden="true" />
            Email terverifikasi
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{verifyState.message}</p>
          <Button asChild className="mt-4 w-full">
            <Link
              href={`/login${completedNext !== "/dashboard" ? `?next=${encodeURIComponent(completedNext)}` : ""}`}
            >
              Masuk ke LearnCode
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="rounded-[8px] border border-line bg-surface p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <MailCheck className="size-4 text-accent-text" aria-hidden="true" />
          Verifikasi email kamu
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{state.message}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Kode dikirim ke <span className="font-medium text-ink-soft">{email}</span>. Periksa
          juga folder spam. Jangan bagikan kode ini kepada siapa pun.
        </p>

        <form action={verifyAction} className="mt-5 space-y-4" noValidate>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={safeNext} />

          <FormField
            id="token"
            label="Kode verifikasi"
            error={verifyErrors.token?.[0]}
            hint="Masukkan 6–10 digit yang tercantum di email."
          >
            <Input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              maxLength={10}
              placeholder="123456"
              required
              aria-invalid={Boolean(verifyErrors.token)}
              aria-describedby={verifyErrors.token ? "token-error" : "token-hint"}
            />
          </FormField>

          {verifyState.status === "error" ? <FormMessage message={verifyState.message} /> : null}

          <Button type="submit" className="w-full" loading={verifyPending}>
            {verifyPending ? "Memverifikasi…" : "Verifikasi kode"}
          </Button>
        </form>

        <form action={resendAction} className="mt-3 space-y-3">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={safeNext} />

          {resendState.status === "error" ? <FormMessage message={resendState.message} /> : null}
          {resendState.status === "success" ? (
            <FormMessage message={resendState.message} tone="success" />
          ) : null}

          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            loading={resendPending}
          >
            {resendPending ? "Mengirim ulang…" : "Kirim ulang kode"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          Salah memasukkan email?{" "}
          <a
            href={`/register${safeNext !== "/dashboard" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="font-medium text-accent-text underline-offset-2 hover:underline"
          >
            Ulangi pendaftaran
          </a>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <Link
            href={`/login${safeNext !== "/dashboard" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="font-medium text-accent-text underline-offset-2 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      <FormField id="fullName" label="Nama lengkap" error={errors.fullName?.[0]}>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          placeholder="Nama kamu"
          required
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
        />
      </FormField>

      <FormField id="email" label="Email" error={errors.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
      </FormField>

      <FormField
        id="password"
        label="Password"
        error={errors.password?.[0]}
        hint="Minimal 8 karakter. Gunakan kombinasi huruf dan angka."
      >
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : "password-hint"}
        />
      </FormField>

      <FormField id="confirmPassword" label="Ulangi password" error={errors.confirmPassword?.[0]}>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
        />
      </FormField>

      {state.status === "error" ? <FormMessage message={state.message} /> : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Membuat akun…" : "Buat akun"}
      </Button>

      {googleRedirectTo ? <GoogleSignInButton redirectTo={googleRedirectTo} label="Daftar dengan Google" /> : null}

      <p className="text-xs leading-relaxed text-muted">
        Pendaftaran dengan email memerlukan kode verifikasi sebelum akun aktif. Google memverifikasi
        akun melalui penyedianya. Dengan membuat akun, kamu menyetujui LearnCode menyimpan nama,
        email, progress belajar, dan hasil quiz untuk menjalankan fitur pembelajaran.
      </p>

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link
          href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent-text underline-offset-2 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";

import { FormField, FormMessage } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );
  const emailError = state.fieldErrors?.email?.[0];

  if (state.status === "success") {
    return (
      <div className="rounded-[8px] border border-line bg-surface p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-ok">
          <MailCheck className="size-4" aria-hidden="true" />
          Periksa inbox kamu
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{state.message}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Tautan reset password berlaku terbatas. Jika email belum masuk dalam
          beberapa menit, periksa folder spam atau ajukan tautan baru.
        </p>
        <Button asChild variant="secondary" className="mt-4 w-full">
          <Link href="/login">Kembali ke halaman masuk</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormField id="email" label="Email" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          required
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "email-error" : undefined}
        />
      </FormField>

      {state.status === "error" ? <FormMessage message={state.message} /> : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Mengirim…" : "Kirim tautan reset"}
      </Button>

      <p className="text-xs leading-relaxed text-muted">
        Demi keamanan, kami tidak memberi tahu apakah sebuah email terdaftar.
        Jika email tersebut ada, tautan reset akan dikirim.
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleCheck } from "lucide-react";

import { FormField, FormMessage, PasswordInput } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { resetPasswordAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { status: "idle" };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div className="rounded-[8px] border border-line bg-surface p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-ok">
          <CircleCheck className="size-4" aria-hidden="true" />
          Password diperbarui
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{state.message}</p>
        <Button asChild className="mt-4 w-full">
          <Link href="/dashboard">Lanjut ke dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormField
        id="password"
        label="Password baru"
        error={errors.password?.[0]}
        hint="Minimal 8 karakter."
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

      <FormField id="confirmPassword" label="Ulangi password baru" error={errors.confirmPassword?.[0]}>
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
        {pending ? "Menyimpan…" : "Simpan password baru"}
      </Button>
    </form>
  );
}

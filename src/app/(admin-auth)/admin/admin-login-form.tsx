"use client";

import { useActionState } from "react";

import { FormField, FormMessage, PasswordInput } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminLoginAction, type AdminLoginState } from "@/lib/actions/admin-auth";

const initialState: AdminLoginState = { status: "idle" };

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLoginAction, initialState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormField id="email" label="Email admin" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          required
          aria-invalid={Boolean(emailError)}
        />
      </FormField>

      <FormField id="password" label="Password" error={passwordError}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </FormField>

      {state.status === "error" ? <FormMessage message={state.message} /> : null}

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Memeriksa…" : "Masuk ke panel admin"}
      </Button>
    </form>
  );
}

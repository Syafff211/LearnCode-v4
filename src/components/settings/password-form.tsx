"use client";

import * as React from "react";
import { useActionState } from "react";

import { FormField, FormMessage, PasswordInput } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { changePasswordAction, type SettingsActionState } from "@/lib/actions/settings";

const initialState: SettingsActionState = { status: "idle" };

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);
  const lastMessage = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (state.status === "success" && state.message !== lastMessage.current) {
      formRef.current?.reset();
    }
    lastMessage.current = state.message;
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <FormField
        id="currentPassword"
        label="Password saat ini"
        error={state.fieldErrors?.currentPassword?.[0]}
      >
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
        />
      </FormField>

      <FormField
        id="newPassword"
        label="Password baru"
        error={state.fieldErrors?.newPassword?.[0]}
        hint="Minimal 8 karakter. Gunakan kombinasi yang tidak dipakai di layanan lain."
      >
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(state.fieldErrors?.newPassword)}
        />
      </FormField>

      <FormField
        id="confirmPassword"
        label="Ulangi password baru"
        error={state.fieldErrors?.confirmPassword?.[0]}
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
        />
      </FormField>

      {state.message ? (
        <FormMessage message={state.message} tone={state.status === "success" ? "success" : "danger"} />
      ) : null}

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" variant="secondary" loading={pending}>
          Ubah password
        </Button>
      </div>
    </form>
  );
}

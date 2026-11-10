"use client";

import { useActionState } from "react";

import { FormField, FormMessage } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { updateProfileAction, type SettingsActionState } from "@/lib/actions/settings";

const initialState: SettingsActionState = { status: "idle" };

export function ProfileForm({
  fullName,
  preferredLanguage,
  theme,
  email,
}: {
  fullName: string;
  preferredLanguage: "id" | "en";
  theme: "light" | "dark" | "system";
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const fullNameError = state.fieldErrors?.fullName?.[0];
  const languageError = state.fieldErrors?.preferredLanguage?.[0];

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="theme" value={theme} />

      <FormField
        id="fullName"
        label="Nama lengkap"
        error={fullNameError}
        hint="Dipakai pada sertifikat dan dashboard. Nama pada sertifikat yang sudah terbit tidak berubah."
      >
        <Input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          autoComplete="name"
          maxLength={80}
          required
          aria-invalid={Boolean(fullNameError)}
          aria-describedby={fullNameError ? "fullName-error" : "fullName-hint"}
        />
      </FormField>

      <FormField id="email" label="Email" hint="Email masuk dikelola oleh Supabase Auth.">
        <Input id="email" name="email" type="email" defaultValue={email} readOnly disabled />
      </FormField>

      <FormField
        id="preferredLanguage"
        label="Bahasa AI Tutor"
        error={languageError}
        hint="Bahasa default untuk jawaban AI Tutor. Kamu tetap bisa menggantinya per percakapan."
      >
        <Select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue={preferredLanguage}
          aria-invalid={Boolean(languageError)}
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </Select>
      </FormField>

      {state.message ? (
        <FormMessage message={state.message} tone={state.status === "success" ? "success" : "danger"} />
      ) : null}

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" loading={pending}>
          Simpan profil
        </Button>
      </div>
    </form>
  );
}

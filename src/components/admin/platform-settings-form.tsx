"use client";

import { useActionState } from "react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";

export function PlatformSettingsForm({
  action,
  initial,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  initial: {
    platformName: string;
    shortDescription: string;
    logoUrl: string;
    faviconUrl: string;
    defaultLanguage: string;
    certificateSignature: string;
    defaultPassingScore: number;
    contactEmail: string;
    contactUrl: string;
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Identitas platform</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Nama platform" htmlFor="platformName" error={errors.platformName}>
            <Input id="platformName" name="platformName" defaultValue={initial.platformName} required maxLength={60} />
          </FormField>
          <FormField label="Bahasa default" htmlFor="defaultLanguage" error={errors.defaultLanguage}>
            <Select id="defaultLanguage" name="defaultLanguage" defaultValue={initial.defaultLanguage}>
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </Select>
          </FormField>
          <FormField
            label="Deskripsi singkat"
            htmlFor="shortDescription"
            error={errors.shortDescription}
            className="sm:col-span-2"
          >
            <Textarea
              id="shortDescription"
              name="shortDescription"
              defaultValue={initial.shortDescription}
              rows={3}
              maxLength={280}
            />
          </FormField>
          <FormField
            label="URL logo (opsional)"
            htmlFor="logoUrl"
            error={errors.logoUrl}
            hint="https://… atau path internal yang diawali /."
          >
            <Input id="logoUrl" name="logoUrl" defaultValue={initial.logoUrl} maxLength={500} />
          </FormField>
          <FormField label="URL favicon (opsional)" htmlFor="faviconUrl" error={errors.faviconUrl}>
            <Input id="faviconUrl" name="faviconUrl" defaultValue={initial.faviconUrl} maxLength={500} />
          </FormField>
        </div>
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Sertifikat & kelulusan</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Tanda tangan sertifikat"
            htmlFor="certificateSignature"
            error={errors.certificateSignature}
            hint="Dipakai pada PDF dan halaman verifikasi."
          >
            <Input
              id="certificateSignature"
              name="certificateSignature"
              defaultValue={initial.certificateSignature}
              required
              maxLength={80}
            />
          </FormField>
          <FormField
            label="Nilai kelulusan default kursus baru (%)"
            htmlFor="defaultPassingScore"
            error={errors.defaultPassingScore}
            hint="Hanya nilai awal untuk kursus baru; kursus yang sudah ada tidak berubah."
          >
            <Input
              id="defaultPassingScore"
              name="defaultPassingScore"
              type="number"
              min={0}
              max={100}
              defaultValue={initial.defaultPassingScore}
              required
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Kontak & operasional</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Email kontak (opsional)" htmlFor="contactEmail" error={errors.contactEmail}>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} maxLength={120} />
          </FormField>
          <FormField label="URL kontak (opsional)" htmlFor="contactUrl" error={errors.contactUrl}>
            <Input id="contactUrl" name="contactUrl" defaultValue={initial.contactUrl} maxLength={300} />
          </FormField>

          <div className="flex items-start gap-2 sm:col-span-2">
            <input
              id="maintenanceMode"
              name="maintenanceMode"
              type="checkbox"
              defaultChecked={initial.maintenanceMode}
              className="mt-0.5 size-4 rounded border-line-strong text-accent focus-visible:ring-accent-text"
            />
            <div>
              <label htmlFor="maintenanceMode" className="text-[0.8125rem] font-medium text-ink">
                Mode pemeliharaan
              </label>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Area belajar (dashboard, lesson, playground, AI) ditutup untuk pengguna biasa
                dan menampilkan pesan pemeliharaan. Admin tetap bisa masuk. Katalog publik
                tidak ikut ditutup.
              </p>
            </div>
          </div>

          <FormField
            label="Pesan pemeliharaan"
            htmlFor="maintenanceMessage"
            error={errors.maintenanceMessage}
            className="sm:col-span-2"
          >
            <Textarea
              id="maintenanceMessage"
              name="maintenanceMessage"
              defaultValue={initial.maintenanceMessage}
              rows={3}
              maxLength={280}
            />
          </FormField>
        </div>
      </section>

      <FormMessage status={state.status} message={state.message} />

      <Button type="submit" loading={pending}>
        Simpan pengaturan platform
      </Button>
    </form>
  );
}

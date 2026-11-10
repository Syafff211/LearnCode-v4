"use client";

import { useActionState } from "react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  AI_FEATURE_KEYS,
  AI_FEATURE_LABELS,
  GROQ_ALLOWED_MODELS,
  GROQ_MODEL_LABELS,
  type AiFeatureKey,
  type GroqAllowedModel,
} from "@/lib/ai/features";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";

export function AiSettingsForm({
  action,
  initial,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  initial: {
    enabled: boolean;
    dailyMessageLimit: number;
    maxInputChars: number;
    maxOutputTokens: number;
    model: string;
    features: string[];
    learningInstructions: string;
  };
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const errors = state.fieldErrors ?? {};
  const features = new Set(initial.features);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Ketersediaan & kuota</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-2">
            <input
              id="enabled"
              name="enabled"
              type="checkbox"
              defaultChecked={initial.enabled}
              className="mt-0.5 size-4 rounded border-line-strong text-accent focus-visible:ring-accent-text"
            />
            <div>
              <label htmlFor="enabled" className="text-[0.8125rem] font-medium text-ink">
                AI Tutor aktif
              </label>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Bila dimatikan, seluruh endpoint AI menolak permintaan di server dan halaman
                belajar menampilkan status nonaktif.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Batas pesan per pengguna per hari"
              htmlFor="dailyMessageLimit"
              error={errors.dailyMessageLimit}
              hint="1–200. Ditegakkan lewat penghitung atomik di database."
            >
              <Input
                id="dailyMessageLimit"
                name="dailyMessageLimit"
                type="number"
                min={1}
                max={200}
                defaultValue={initial.dailyMessageLimit}
                required
              />
            </FormField>

            <FormField
              label="Maksimal karakter pesan"
              htmlFor="maxInputChars"
              error={errors.maxInputChars}
              hint="400–20000. Divalidasi ulang di server untuk setiap permintaan."
            >
              <Input
                id="maxInputChars"
                name="maxInputChars"
                type="number"
                min={400}
                max={20000}
                defaultValue={initial.maxInputChars}
                required
              />
            </FormField>

            <FormField
              label="Maksimal token output"
              htmlFor="maxOutputTokens"
              error={errors.maxOutputTokens}
              hint="100–4000. Dikirim ke Groq sebagai max_tokens."
            >
              <Input
                id="maxOutputTokens"
                name="maxOutputTokens"
                type="number"
                min={100}
                max={4000}
                defaultValue={initial.maxOutputTokens}
                required
              />
            </FormField>

            <FormField
              label="Model Groq"
              htmlFor="model"
              error={errors.model}
              hint="Hanya model yang terdaftar sebagai tersedia. Kunci API tetap dari environment."
            >
              <Select id="model" name="model" defaultValue={initial.model}>
                {GROQ_ALLOWED_MODELS.map((model: GroqAllowedModel) => (
                  <option key={model} value={model}>
                    {GROQ_MODEL_LABELS[model]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Fitur AI yang tersedia</h2>
        <div className="mt-3 space-y-2">
          {AI_FEATURE_KEYS.map((key: AiFeatureKey) => (
            <div key={key} className="flex items-start gap-2">
              <input
                id={`feature-${key}`}
                name={`feature-${key}`}
                type="checkbox"
                defaultChecked={features.has(key)}
                className="mt-0.5 size-4 rounded border-line-strong text-accent focus-visible:ring-accent-text"
              />
              <label htmlFor={`feature-${key}`} className="text-[0.8125rem] text-ink">
                {AI_FEATURE_LABELS[key]}
                <span className="ml-1 font-mono text-[10px] text-muted">{key}</span>
              </label>
            </div>
          ))}
        </div>
        {errors.features ? (
          <p role="alert" className="mt-2 text-[11px] text-danger">
            {errors.features.join(" ")}
          </p>
        ) : null}
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <FormField
          label="Instruksi belajar tambahan"
          htmlFor="learningInstructions"
          error={errors.learningInstructions}
          hint="Disimpan di database, bukan di browser. Dikirim sebagai panduan sistem tambahan yang tidak boleh melanggar aturan keamanan inti. Jangan menulis kunci API atau data pribadi di sini."
        >
          <Textarea
            id="learningInstructions"
            name="learningInstructions"
            defaultValue={initial.learningInstructions}
            rows={6}
            maxLength={4000}
            placeholder="Contoh: Dorong siswa menjelaskan langkahnya sendiri sebelum memberi solusi lengkap."
          />
        </FormField>
      </section>

      <FormMessage status={state.status} message={state.message} />

      <Button type="submit" loading={pending}>
        Simpan pengaturan AI
      </Button>
    </form>
  );
}

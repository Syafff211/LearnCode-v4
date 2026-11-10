"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  IDLE_ADMIN_STATE,
  type AdminActionState,
} from "@/lib/actions/admin-state";

type CourseInitial = {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  level: string;
  language: string;
  durationMinutes: number;
  objectives: string[];
  passingScore: number;
  requireAllLessons: boolean;
  position: number;
  status: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function CourseForm({
  action,
  course,
  defaultPassingScore,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  course?: CourseInitial;
  defaultPassingScore: number;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const isEdit = Boolean(course);
  const [slug, setSlug] = useState(course?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {isEdit ? (
        <input type="hidden" name="courseId" value={course?.id} />
      ) : (
        <input type="hidden" name="status" value="draft" />
      )}

      <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Identitas kursus</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Judul" htmlFor="title" error={errors.title} className="sm:col-span-2">
            <Input
              id="title"
              name="title"
              defaultValue={course?.title}
              required
              maxLength={120}
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
            />
          </FormField>

          <FormField
            label="Slug URL"
            htmlFor="slug"
            error={errors.slug}
            hint="Dipakai di /courses/<slug>. Hanya huruf kecil, angka, dan tanda hubung."
          >
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(slugify(event.target.value));
              }}
              required
              className="font-mono text-[0.8125rem]"
            />
          </FormField>

          <FormField label="Tagline" htmlFor="tagline" error={errors.tagline}>
            <Input id="tagline" name="tagline" defaultValue={course?.tagline} required maxLength={160} />
          </FormField>

          <FormField
            label="Deskripsi"
            htmlFor="description"
            error={errors.description}
            className="sm:col-span-2"
          >
            <Textarea
              id="description"
              name="description"
              defaultValue={course?.description}
              required
              rows={4}
              maxLength={4000}
            />
          </FormField>

          <FormField label="Level" htmlFor="level" error={errors.level}>
            <Select id="level" name="level" defaultValue={course?.level ?? "pemula"}>
              <option value="pemula">Pemula</option>
              <option value="menengah">Menengah</option>
              <option value="lanjutan">Lanjutan</option>
            </Select>
          </FormField>

          <FormField label="Bahasa materi" htmlFor="language" error={errors.language}>
            <Select id="language" name="language" defaultValue={course?.language ?? "id"}>
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </Select>
          </FormField>

          <FormField label="Durasi (menit)" htmlFor="durationMinutes" error={errors.durationMinutes}>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={0}
              max={6000}
              defaultValue={course?.durationMinutes ?? 180}
              required
            />
          </FormField>

          <FormField label="Urutan tampil" htmlFor="position" error={errors.position} hint="Angka kecil tampil lebih dulu.">
            <Input
              id="position"
              name="position"
              type="number"
              min={0}
              max={999}
              defaultValue={course?.position ?? 0}
              required
            />
          </FormField>

          <FormField
            label="Tujuan pembelajaran"
            htmlFor="objectives"
            error={errors.objectives}
            hint="Satu tujuan per baris. Minimal satu tujuan sebelum kursus dipublikasikan."
            className="sm:col-span-2"
          >
            <Textarea
              id="objectives"
              name="objectives"
              defaultValue={(course?.objectives ?? []).join("\n")}
              rows={4}
            />
          </FormField>
        </div>
      </div>

      <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Kelulusan</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Nilai kelulusan quiz (%)"
            htmlFor="passingScore"
            error={errors.passingScore}
            hint={`Nilai default platform: ${defaultPassingScore}%.`}
          >
            <Input
              id="passingScore"
              name="passingScore"
              type="number"
              min={0}
              max={100}
              defaultValue={course?.passingScore ?? defaultPassingScore}
              required
            />
          </FormField>

          <div className="flex items-start gap-2 pt-6">
            <input
              id="requireAllLessons"
              name="requireAllLessons"
              type="checkbox"
              defaultChecked={course?.requireAllLessons ?? true}
              className="mt-0.5 size-4 rounded border-line-strong text-accent focus-visible:ring-accent-text"
            />
            <div>
              <label htmlFor="requireAllLessons" className="text-[0.8125rem] font-medium text-ink">
                Wajibkan semua lesson yang ditandai wajib
              </label>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Bila dimatikan, kelulusan quiz saja cukup untuk sertifikat. Lesson
                opsional tetap tersedia untuk dipelajari.
              </p>
            </div>
          </div>

          {isEdit ? (
            <FormField label="Status" htmlFor="status" error={errors.status} className="sm:col-span-2">
              <Select id="status" name="status" defaultValue={course?.status ?? "draft"}>
                <option value="draft">Draft — belum tampil di katalog</option>
                <option value="published">Terbit — dapat diakses peserta</option>
                <option value="archived">Arsip — ditutup, riwayat tetap ada</option>
              </Select>
            </FormField>
          ) : (
            <div className="sm:col-span-2 rounded-[6px] border border-line bg-surface-2/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              Kursus baru selalu disimpan sebagai <strong className="font-medium text-ink-soft">draft</strong>.
              Tambahkan dan publikasikan minimal satu lesson, lalu terbitkan kursus dari halaman ini.
            </div>
          )}
        </div>
      </div>

      <FormMessage status={state.status} message={state.message} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending}>
          {isEdit ? "Simpan perubahan" : "Simpan sebagai draft"}
        </Button>
        <Button asChild variant="ghost" type="button">
          <Link href={isEdit ? `/admin/courses/${course?.id}` : "/admin/courses"}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

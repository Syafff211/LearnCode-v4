"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";

type QuizInitial = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  passingScore: number;
  required: boolean;
};

export function QuizForm({
  action,
  courses,
  quiz,
  defaultCourseId,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  courses: { id: string; title: string; passing_score: number }[];
  quiz?: QuizInitial;
  defaultCourseId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const isEdit = Boolean(quiz);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {isEdit ? <input type="hidden" name="quizId" value={quiz?.id} /> : null}

      <div className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Kursus" htmlFor="courseId" error={errors.courseId}>
            <Select
              id="courseId"
              name="courseId"
              defaultValue={quiz?.courseId ?? defaultCourseId ?? ""}
              required
              disabled={isEdit}
            >
              <option value="" disabled>
                Pilih kursus
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </Select>
            {isEdit ? <input type="hidden" name="courseId" value={quiz?.courseId} /> : null}
          </FormField>

          <FormField label="Nilai lulus (%)" htmlFor="passingScore" error={errors.passingScore}>
            <Input
              id="passingScore"
              name="passingScore"
              type="number"
              min={0}
              max={100}
              defaultValue={quiz?.passingScore ?? 80}
              required
            />
          </FormField>

          <FormField label="Judul quiz" htmlFor="title" error={errors.title} className="sm:col-span-2">
            <Input id="title" name="title" defaultValue={quiz?.title} required maxLength={120} />
          </FormField>

          <FormField label="Deskripsi" htmlFor="description" error={errors.description} className="sm:col-span-2">
            <Textarea id="description" name="description" defaultValue={quiz?.description} rows={3} required maxLength={1000} />
          </FormField>

          <div className="flex items-start gap-2 sm:col-span-2">
            <input
              id="required"
              name="required"
              type="checkbox"
              defaultChecked={quiz?.required ?? true}
              className="mt-0.5 size-4 rounded border-line-strong text-accent focus-visible:ring-accent-text"
            />
            <div>
              <label htmlFor="required" className="text-[0.8125rem] font-medium text-ink">
                Quiz wajib untuk sertifikat
              </label>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Bila dimatikan, quiz tetap bisa dikerjakan tetapi bukan syarat kelulusan.
                Perubahan ini hanya berlaku untuk percobaan berikutnya.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isEdit ? (
        <div className="rounded-[6px] border border-highlight/25 bg-highlight-soft px-3 py-2.5 text-[11px] leading-relaxed text-ink-soft">
          Mengubah bobot soal atau ambang nilai tidak mengubah skor percobaan yang sudah
          tercatat dan tidak mencabut sertifikat yang sudah terbit. Skor lama disimpan
          bersama aturan penilaian yang berlaku saat itu.
        </div>
      ) : null}

      <FormMessage status={state.status} message={state.message} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending}>
          {isEdit ? "Simpan quiz" : "Buat quiz"}
        </Button>
        <Button asChild variant="ghost" type="button">
          <Link href={isEdit ? `/admin/quizzes/${quiz?.id}` : "/admin/quizzes"}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

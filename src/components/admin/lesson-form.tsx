"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Link2, Trash2, Video } from "lucide-react";

import { FormField, FormMessage } from "@/components/admin/primitives";
import { YouTubeVideo } from "@/components/learning/youtube-video";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { IDLE_ADMIN_STATE, type AdminActionState } from "@/lib/actions/admin-state";
import { parseYouTubeVideoId } from "@/lib/youtube";

type LessonInitial = {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  summary: string;
  contentMd: string;
  objectives: string[];
  estimatedMinutes: number;
  required: boolean;
  status: string;
  codeExample: { language?: string; filename?: string; caption?: string; code?: string };
  exercise: {
    title?: string;
    brief?: string;
    steps?: string[];
    hint?: string;
    starter?: { html?: string; css?: string; js?: string };
  };
  youtubeVideoId?: string | null;
  youtubeVideoTitle?: string | null;
  youtubeVideoDescription?: string | null;
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

function LessonSection({
  title,
  description,
  defaultOpen = false,
  hasError = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  hasError?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || hasError);
  const visibleOpen = open || hasError;

  return (
    <details
      open={visibleOpen}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="group rounded-[8px] border border-line bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-text sm:px-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-base font-semibold text-ink">{title}</span>
          {description ? <span className="mt-0.5 block text-[11px] text-muted">{description}</span> : null}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-line px-4 py-4 sm:px-5">{children}</div>
    </details>
  );
}

export function LessonForm({
  action,
  courses,
  lesson,
  defaultCourseId,
}: {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  courses: { id: string; title: string; slug: string }[];
  lesson?: LessonInitial;
  defaultCourseId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_STATE);
  const isEdit = Boolean(lesson);
  const errors = state.fieldErrors ?? {};
  const [slug, setSlug] = useState(lesson?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [youtubeUrl, setYoutubeUrl] = useState(
    lesson?.youtubeVideoId ? `https://youtu.be/${lesson.youtubeVideoId}` : "",
  );
  const [youtubeTitle, setYoutubeTitle] = useState(lesson?.youtubeVideoTitle ?? "");
  const [youtubeDescription, setYoutubeDescription] = useState(lesson?.youtubeVideoDescription ?? "");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const videoId = parseYouTubeVideoId(youtubeUrl);
  const hasVideoError = Boolean(errors.youtubeUrl || youtubeError);

  function validateYouTubeFields(event: FormEvent<HTMLFormElement>) {
    const hasMetadata = youtubeTitle.trim().length > 0 || youtubeDescription.trim().length > 0;
    if (youtubeUrl.trim() && !videoId) {
      event.preventDefault();
      setYoutubeError("Masukkan URL YouTube yang valid: watch, youtu.be, Shorts, atau embed.");
      document.getElementById("youtubeUrl")?.focus();
      return;
    }
    if (!youtubeUrl.trim() && hasMetadata) {
      event.preventDefault();
      setYoutubeError("Masukkan URL video sebelum mengisi judul atau deskripsi.");
      document.getElementById("youtubeUrl")?.focus();
      return;
    }
    setYoutubeError(null);
  }

  function removeVideo() {
    setYoutubeUrl("");
    setYoutubeTitle("");
    setYoutubeDescription("");
    setYoutubeError(null);
  }

  const hasErrorIn = (...keys: string[]) => keys.some((key) => Boolean(errors[key]?.length));

  return (
    <form
      action={formAction}
      onSubmit={validateYouTubeFields}
      className="space-y-3"
      noValidate
    >
      {isEdit ? <input type="hidden" name="lessonId" value={lesson?.id} /> : null}

      <LessonSection
        title="Informasi dasar"
        description="Judul, alamat, kursus, dan estimasi belajar."
        defaultOpen
        hasError={hasErrorIn("courseId", "title", "slug", "summary", "estimatedMinutes", "objectives")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Kursus induk" htmlFor="courseId" error={errors.courseId}>
            <Select
              id="courseId"
              name="courseId"
              defaultValue={lesson?.courseId ?? defaultCourseId ?? ""}
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
            {isEdit ? <input type="hidden" name="courseId" value={lesson?.courseId} /> : null}
          </FormField>

          <FormField label="Judul" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              name="title"
              defaultValue={lesson?.title}
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
            hint="Unik di seluruh platform: /learn/<slug>."
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

          <FormField label="Estimasi (menit)" htmlFor="estimatedMinutes" error={errors.estimatedMinutes}>
            <Input
              id="estimatedMinutes"
              name="estimatedMinutes"
              type="number"
              min={1}
              max={600}
              defaultValue={lesson?.estimatedMinutes ?? 20}
              required
            />
          </FormField>

          <FormField label="Ringkasan" htmlFor="summary" error={errors.summary} className="sm:col-span-2">
            <Input id="summary" name="summary" defaultValue={lesson?.summary} required maxLength={280} />
          </FormField>

          <FormField
            label="Tujuan lesson"
            htmlFor="objectives"
            error={errors.objectives}
            hint="Satu tujuan per baris."
            className="sm:col-span-2"
          >
            <Textarea id="objectives" name="objectives" defaultValue={(lesson?.objectives ?? []).join("\n")} rows={3} />
          </FormField>
        </div>
      </LessonSection>

      <LessonSection
        title="Materi"
        description="Konten utama yang ditampilkan di halaman lesson."
        defaultOpen
        hasError={hasErrorIn("contentMd")}
      >
        <p className="text-[11px] leading-relaxed text-muted">
          Markdown didukung: heading, paragraf, daftar, tautan, dan blok kode berpagar. HTML mentah tidak dieksekusi.
        </p>
        <FormField label="Isi lesson (Markdown)" htmlFor="contentMd" error={errors.contentMd} className="mt-4">
          <Textarea
            id="contentMd"
            name="contentMd"
            defaultValue={lesson?.contentMd}
            required
            rows={16}
            className="font-mono text-[0.8125rem] leading-relaxed"
          />
        </FormField>
      </LessonSection>

      <LessonSection
        title="Kode dan latihan"
        description="Contoh kode, instruksi latihan, dan starter playground."
        hasError={hasErrorIn(
          "codeLanguage",
          "codeFilename",
          "codeCaption",
          "code",
          "exerciseTitle",
          "exerciseBrief",
          "exerciseHint",
          "exerciseSteps",
          "starterHtml",
          "starterCss",
          "starterJs",
        )}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-ink">Contoh kode</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormField label="Bahasa" htmlFor="codeLanguage" error={errors.codeLanguage}>
                <Select id="codeLanguage" name="codeLanguage" defaultValue={lesson?.codeExample?.language ?? "html"}>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="javascript">JavaScript</option>
                </Select>
              </FormField>
              <FormField label="Nama file" htmlFor="codeFilename" error={errors.codeFilename}>
                <Input
                  id="codeFilename"
                  name="codeFilename"
                  defaultValue={lesson?.codeExample?.filename}
                  maxLength={60}
                  placeholder="index.html"
                  className="font-mono text-[0.8125rem]"
                />
              </FormField>
              <FormField label="Keterangan" htmlFor="codeCaption" error={errors.codeCaption} className="sm:col-span-2">
                <Input id="codeCaption" name="codeCaption" defaultValue={lesson?.codeExample?.caption} maxLength={160} />
              </FormField>
              <FormField label="Kode" htmlFor="code" error={errors.code} className="sm:col-span-2">
                <Textarea
                  id="code"
                  name="code"
                  defaultValue={lesson?.codeExample?.code}
                  rows={8}
                  className="font-mono text-[0.8125rem] leading-relaxed"
                />
              </FormField>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <h3 className="text-sm font-medium text-ink">Latihan playground</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Starter dipakai sebagai isi awal editor. Kode tetap berjalan di playground terisolasi.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormField label="Judul latihan" htmlFor="exerciseTitle" error={errors.exerciseTitle}>
                <Input id="exerciseTitle" name="exerciseTitle" defaultValue={lesson?.exercise?.title} maxLength={120} />
              </FormField>
              <FormField label="Hint" htmlFor="exerciseHint" error={errors.exerciseHint}>
                <Input id="exerciseHint" name="exerciseHint" defaultValue={lesson?.exercise?.hint} maxLength={400} />
              </FormField>
              <FormField label="Brief" htmlFor="exerciseBrief" error={errors.exerciseBrief} className="sm:col-span-2">
                <Textarea id="exerciseBrief" name="exerciseBrief" defaultValue={lesson?.exercise?.brief} rows={3} />
              </FormField>
              <FormField
                label="Langkah latihan"
                htmlFor="exerciseSteps"
                error={errors.exerciseSteps}
                hint="Satu langkah per baris."
                className="sm:col-span-2"
              >
                <Textarea id="exerciseSteps" name="exerciseSteps" defaultValue={(lesson?.exercise?.steps ?? []).join("\n")} rows={4} />
              </FormField>
              <FormField label="Starter HTML" htmlFor="starterHtml" error={errors.starterHtml}>
                <Textarea
                  id="starterHtml"
                  name="starterHtml"
                  defaultValue={lesson?.exercise?.starter?.html}
                  rows={6}
                  className="font-mono text-[0.8125rem]"
                />
              </FormField>
              <FormField label="Starter CSS" htmlFor="starterCss" error={errors.starterCss}>
                <Textarea
                  id="starterCss"
                  name="starterCss"
                  defaultValue={lesson?.exercise?.starter?.css}
                  rows={6}
                  className="font-mono text-[0.8125rem]"
                />
              </FormField>
              <FormField label="Starter JavaScript" htmlFor="starterJs" error={errors.starterJs} className="sm:col-span-2">
                <Textarea
                  id="starterJs"
                  name="starterJs"
                  defaultValue={lesson?.exercise?.starter?.js}
                  rows={6}
                  className="font-mono text-[0.8125rem]"
                />
              </FormField>
            </div>
          </div>
        </div>
      </LessonSection>

      <LessonSection
        title="Video pembelajaran"
        description="Opsional. Hanya URL dan ID YouTube yang divalidasi yang disimpan."
        defaultOpen={Boolean(lesson?.youtubeVideoId)}
        hasError={hasErrorIn("youtubeUrl", "youtubeTitle", "youtubeDescription") || hasVideoError}
      >
        <div className="space-y-4">
          <FormField
            label="URL YouTube"
            htmlFor="youtubeUrl"
            error={errors.youtubeUrl ?? (youtubeError ? [youtubeError] : undefined)}
            hint="Terima link youtube.com/watch, youtu.be, Shorts, live, atau embed. HTML iframe tidak diterima."
          >
            <Input
              id="youtubeUrl"
              name="youtubeUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              value={youtubeUrl}
              onChange={(event) => {
                const value = event.target.value;
                setYoutubeUrl(value);
                setYoutubeError(
                  value.trim() && !parseYouTubeVideoId(value)
                    ? "URL bukan format YouTube yang didukung."
                    : null,
                );
              }}
              maxLength={500}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Judul video" htmlFor="youtubeTitle" error={errors.youtubeTitle}>
              <Input
                id="youtubeTitle"
                name="youtubeTitle"
                value={youtubeTitle}
                onChange={(event) => setYoutubeTitle(event.target.value)}
                maxLength={120}
                placeholder="Opsional"
              />
            </FormField>
            <FormField label="Deskripsi" htmlFor="youtubeDescription" error={errors.youtubeDescription}>
              <Input
                id="youtubeDescription"
                name="youtubeDescription"
                value={youtubeDescription}
                onChange={(event) => setYoutubeDescription(event.target.value)}
                maxLength={500}
                placeholder="Opsional"
              />
            </FormField>
          </div>

          {videoId ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                <Video className="size-3.5 text-accent-text" aria-hidden="true" />
                Pratinjau embed
              </p>
              <YouTubeVideo
                videoId={videoId}
                title={youtubeTitle || null}
                description={youtubeDescription || null}
              />
            </div>
          ) : youtubeUrl.trim() ? (
            <p className="rounded-[5px] border border-danger/25 bg-danger-soft/50 px-3 py-2 text-xs text-danger">
              URL belum dapat dipratinjau. Periksa domain dan ID videonya.
            </p>
          ) : (
            <p className="rounded-[5px] border border-dashed border-line-strong px-3 py-3 text-xs text-muted">
              Video akan muncul pada halaman lesson setelah URL valid disimpan.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <p className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <Link2 className="size-3" aria-hidden="true" />
              Embed privacy-enhanced, tanpa autoplay.
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={removeVideo}
              disabled={!youtubeUrl && !youtubeTitle && !youtubeDescription}
            >
              <Trash2 aria-hidden="true" />
              Hapus video
            </Button>
          </div>
        </div>
      </LessonSection>

      <LessonSection
        title="Publikasi"
        description="Status tampil dan pengaruh lesson terhadap syarat kelulusan."
        defaultOpen
        hasError={hasErrorIn("status", "required")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Status" htmlFor="status" error={errors.status}>
            <Select id="status" name="status" defaultValue={lesson?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="published">Terbit</option>
              <option value="archived">Arsip</option>
            </Select>
          </FormField>
          <div className="flex items-start gap-2 pt-2 sm:pt-7">
            <input
              id="required"
              name="required"
              type="checkbox"
              defaultChecked={lesson?.required ?? true}
              className="mt-0.5 size-4 rounded border-line-strong text-accent focus-visible:ring-accent-text"
            />
            <div>
              <label htmlFor="required" className="text-[0.8125rem] font-medium text-ink">
                Lesson wajib
              </label>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                Menentukan kelulusan jika kursus mewajibkan semua lesson.
              </p>
            </div>
          </div>
        </div>
      </LessonSection>

      <FormMessage status={state.status} message={state.message} />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit" loading={pending}>
          Simpan lesson
        </Button>
        <Button asChild variant="ghost" type="button">
          <Link href={isEdit ? `/admin/lessons/${lesson?.id}` : "/admin/lessons"}>Batal</Link>
        </Button>
      </div>
    </form>
  );
}

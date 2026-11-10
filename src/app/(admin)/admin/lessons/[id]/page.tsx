import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { LessonForm } from "@/components/admin/lesson-form";
import { YouTubeVideo } from "@/components/learning/youtube-video";
import {
  FlashNotice,
  PageHeader,
  StatusBadge,
} from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { Button } from "@/components/ui/button";
import { deleteLessonAction, setLessonStatusAction, updateLessonAction } from "@/lib/actions/admin-lessons";
import { requireAdminPage } from "@/lib/admin/auth";
import { getLessonDetail, listCourseOptions } from "@/lib/admin/queries";
import { renderMarkdown } from "@/lib/markdown";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sunting lesson",
  robots: { index: false, follow: false },
};

export default async function LessonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { db } = await requireAdminPage(`/admin/lessons/${id}`);

  const detail = await getLessonDetail(db, id);
  if (!detail) notFound();

  const courses = await listCourseOptions(db);
  const { lesson } = detail;
  const previewHtml = await renderMarkdown(lesson.content_md);
  const canPublish = lesson.content_md.trim().length >= 80;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lesson.title}
        description={`${detail.course.title} · diperbarui ${formatDateTime(lesson.updated_at)}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Lesson", href: "/admin/lessons" },
          { label: lesson.title },
        ]}
        actions={
          <>
            <StatusBadge status={lesson.status} />
            {lesson.status === "published" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={`/learn/${lesson.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" />
                  Buka lesson
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/courses/${detail.course.id}`}>Kembali ke kursus</Link>
            </Button>
          </>
        }
      />

      {query.created === "1" ? (
        <FlashNotice>Lesson dibuat. Periksa pratinjau di bawah sebelum menerbitkan.</FlashNotice>
      ) : null}

      {!canPublish ? (
        <FlashNotice tone="warning">
          Isi lesson masih di bawah 80 karakter. Server akan menolak publikasi sampai materinya lengkap.
        </FlashNotice>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-line bg-surface p-3">
        <span className="text-[0.8125rem] text-muted">Status cepat:</span>
        <QuickAction action={setLessonStatusAction} fields={{ lessonId: lesson.id, status: "published" }} label="Terbitkan" variant="secondary" />
        <QuickAction action={setLessonStatusAction} fields={{ lessonId: lesson.id, status: "draft" }} label="Jadikan draft" />
        <QuickAction
          action={setLessonStatusAction}
          fields={{ lessonId: lesson.id, status: "archived" }}
          label="Arsipkan"
          confirm="Arsipkan lesson ini?"
        />
      </div>

      <LessonForm
        action={updateLessonAction}
        courses={courses.map((course) => ({ id: course.id, title: course.title, slug: course.slug }))}
        lesson={{
          id: lesson.id,
          courseId: lesson.course_id,
          title: lesson.title,
          slug: lesson.slug,
          summary: lesson.summary,
          contentMd: lesson.content_md,
          objectives: lesson.objectives ?? [],
          estimatedMinutes: lesson.estimated_minutes,
          required: lesson.required,
          status: lesson.status,
          codeExample: (lesson.code_example ?? {}) as {
            language?: string;
            filename?: string;
            caption?: string;
            code?: string;
          },
          exercise: (lesson.exercise ?? {}) as {
            title?: string;
            brief?: string;
            steps?: string[];
            hint?: string;
            starter?: { html?: string; css?: string; js?: string };
          },
          youtubeVideoId: lesson.youtube_video_id,
          youtubeVideoTitle: lesson.youtube_video_title,
          youtubeVideoDescription: lesson.youtube_video_description,
        }}
      />

      <section className="rounded-[8px] border border-line bg-surface" aria-labelledby="preview-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            <h2 id="preview-heading" className="font-display text-base font-semibold text-ink">
              Pratinjau materi
            </h2>
            <p className="text-[11px] text-muted">Hasil render Markdown yang sama dengan halaman belajar.</p>
          </div>
          <span className="font-mono text-[10px] text-muted">{lesson.content_md.length} karakter</span>
        </div>
        <div className="px-4 py-4">
          {previewHtml ? (
            <div
              className="prose-lc max-w-none text-[0.9375rem]"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="text-sm text-muted">Belum ada materi yang bisa ditampilkan.</p>
          )}
          {lesson.youtube_video_id ? (
            <YouTubeVideo
              className="mt-6 max-w-3xl"
              videoId={lesson.youtube_video_id}
              title={lesson.youtube_video_title}
              description={lesson.youtube_video_description}
            />
          ) : null}
        </div>
      </section>

      <section className="rounded-[8px] border border-danger/30 bg-danger-soft/40 p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Zona berbahaya</h2>
        <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-soft">
          Lesson yang sudah pernah diselesaikan peserta tidak bisa dihapus; arsipkan
          agar riwayat tetap konsisten.
        </p>
        <div className="mt-3">
          <ConfirmAction
            action={deleteLessonAction}
            fields={{ lessonId: lesson.id }}
            title={`Hapus lesson "${lesson.title}"?`}
            description="Penghapusan permanen. Server menolak bila lesson ini sudah punya riwayat belajar."
            triggerLabel="Hapus lesson"
            confirmLabel="Hapus permanen"
            requireText={lesson.slug}
            textLabel={`Ketik slug "${lesson.slug}" untuk mengonfirmasi`}
          />
        </div>
      </section>
    </div>
  );
}

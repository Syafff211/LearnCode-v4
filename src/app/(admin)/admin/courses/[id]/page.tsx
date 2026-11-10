import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, PlusCircle } from "lucide-react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { CourseForm } from "@/components/admin/course-form";
import {
  DataTable,
  EmptyState,
  FlashNotice,
  PageHeader,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { Button } from "@/components/ui/button";
import {
  deleteCourseAction,
  setCourseStatusAction,
  updateCourseAction,
} from "@/lib/actions/admin-courses";
import { moveLessonAction, setLessonStatusAction } from "@/lib/actions/admin-lessons";
import { requireAdminPage } from "@/lib/admin/auth";
import { getCourseDetail } from "@/lib/admin/queries";
import { getPlatformSettings } from "@/lib/platform";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sunting kursus",
  robots: { index: false, follow: false },
};

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { db } = await requireAdminPage(`/admin/courses/${id}`);

  const detail = await getCourseDetail(db, id);
  if (!detail) notFound();

  const platform = await getPlatformSettings();
  const { course, lessons, quiz, stats } = detail;

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        description={course.tagline}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Kursus", href: "/admin/courses" },
          { label: course.title },
        ]}
        actions={
          <>
            <StatusBadge status={course.status} />
            {course.status === "published" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={`/courses/${course.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink aria-hidden="true" />
                  Lihat kursus
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/lessons/new?courseId=${course.id}`}>
                <PlusCircle aria-hidden="true" />
                Lesson baru
              </Link>
            </Button>
          </>
        }
      />

      {query.created === "1" ? (
        <FlashNotice>Kursus dibuat sebagai draft. Tambahkan lesson, lalu terbitkan saat siap.</FlashNotice>
      ) : null}

      <section className="grid gap-3 rounded-[8px] border border-line bg-surface p-4 text-[0.8125rem] sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Lesson</p>
          <p className="mt-1 font-mono text-lg text-ink">{stats?.lessons_count ?? lessons.length}</p>
          <p className="text-[11px] text-muted">{stats?.required_lessons_count ?? lessons.filter((lesson) => lesson.required).length} wajib</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Peserta</p>
          <p className="mt-1 font-mono text-lg text-ink">{stats?.participants ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Sertifikat</p>
          <p className="mt-1 font-mono text-lg text-ink">{stats?.certificates ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Terakhir diubah</p>
          <p className="mt-1 text-ink">{formatDateTime(course.updated_at)}</p>
        </div>
      </section>

      <CourseForm
        action={updateCourseAction}
        defaultPassingScore={platform.defaultPassingScore}
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug,
          tagline: course.tagline,
          description: course.description,
          level: course.level,
          language: course.language,
          durationMinutes: course.duration_minutes,
          objectives: course.objectives ?? [],
          passingScore: course.passing_score,
          requireAllLessons: course.require_all_lessons,
          position: course.position,
          status: course.status,
        }}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Lesson kursus ini</h2>
            <p className="text-xs text-muted">Urutan menentukan tampilan di halaman belajar.</p>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/lessons/new?courseId=${course.id}`}>Tambah lesson</Link>
          </Button>
        </div>

        {lessons.length === 0 ? (
          <EmptyState
            title="Belum ada lesson"
            description="Kursus butuh minimal satu lesson yang dipublikasikan sebelum bisa diterbitkan ke peserta."
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href={`/admin/lessons/new?courseId=${course.id}`}>Buat lesson pertama</Link>
              </Button>
            }
          />
        ) : (
          <DataTable caption="Lesson kursus">
            <THead>
              <TR>
                <TH>#</TH>
                <TH>Lesson</TH>
                <TH>Waktu</TH>
                <TH>Status</TH>
                <TH>Urutan</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {lessons.map((lesson) => (
                <TR key={lesson.id}>
                  <TD className="font-mono text-[11px] text-muted">{lesson.position}</TD>
                  <TD>
                    <Link href={`/admin/lessons/${lesson.id}`} className="font-medium text-ink hover:underline">
                      {lesson.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">{lesson.slug}</p>
                    {!lesson.required ? <p className="mt-0.5 text-[10px] text-muted">Opsional</p> : null}
                  </TD>
                  <TD className="whitespace-nowrap text-muted">{lesson.estimated_minutes} menit</TD>
                  <TD>
                    <StatusBadge status={lesson.status} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <QuickAction action={moveLessonAction} fields={{ lessonId: lesson.id, direction: "up" }} label="Naikkan">
                        <ArrowUp aria-hidden="true" />
                      </QuickAction>
                      <QuickAction action={moveLessonAction} fields={{ lessonId: lesson.id, direction: "down" }} label="Turunkan">
                        <ArrowDown aria-hidden="true" />
                      </QuickAction>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/lessons/${lesson.id}`}>Sunting</Link>
                      </Button>
                      {lesson.status === "published" ? (
                        <QuickAction action={setLessonStatusAction} fields={{ lessonId: lesson.id, status: "draft" }} label="Jadikan draft" />
                      ) : (
                        <QuickAction action={setLessonStatusAction} fields={{ lessonId: lesson.id, status: "published" }} label="Terbitkan" />
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Quiz akhir</h2>
            <p className="text-xs text-muted">Satu kursus memiliki satu quiz akhir yang dinilai di server.</p>
          </div>
          {quiz ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/admin/quizzes/${quiz.id}`}>Kelola quiz</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/admin/quizzes/new?courseId=${course.id}`}>Buat quiz</Link>
            </Button>
          )}
        </div>
        {quiz ? (
          <dl className="mt-3 grid gap-2 text-[0.8125rem] sm:grid-cols-3">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.06em] text-muted">Judul</dt>
              <dd className="text-ink">{quiz.title}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.06em] text-muted">Pertanyaan</dt>
              <dd className="font-mono text-ink">{quiz.questions.length}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.06em] text-muted">Nilai lulus</dt>
              <dd className="font-mono text-ink">{quiz.passing_score}%</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-[0.8125rem] text-muted">
            Belum ada quiz. Sertifikat tidak akan terbit tanpa quiz yang lulus.
          </p>
        )}
      </section>

      <section className="rounded-[8px] border border-danger/30 bg-danger-soft/40 p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Zona berbahaya</h2>
        <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-soft">
          Mengarsipkan kursus menutup akses tanpa menyentuh riwayat. Penghapusan permanen
          hanya tersedia bila kursus belum punya peserta, percobaan quiz, atau sertifikat.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {course.status !== "archived" ? (
            <QuickAction
              action={setCourseStatusAction}
              fields={{ courseId: course.id, status: "archived" }}
              label="Arsipkan kursus"
              variant="secondary"
              confirm="Arsipkan kursus ini? Materi tidak lagi tampil di katalog."
            />
          ) : (
            <QuickAction action={setCourseStatusAction} fields={{ courseId: course.id, status: "draft" }} label="Kembalikan ke draft" variant="secondary" />
          )}
          <ConfirmAction
            action={deleteCourseAction}
            fields={{ courseId: course.id }}
            title={`Hapus kursus "${course.title}"?`}
            description="Tindakan ini permanen. Jika kursus sudah punya riwayat, server akan menolak dan kamu harus memakai arsip."
            triggerLabel="Hapus kursus"
            confirmLabel="Hapus permanen"
            requireText={course.slug}
            textLabel={`Ketik slug "${course.slug}" untuk mengonfirmasi`}
          />
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, PlusCircle } from "lucide-react";

import { FilterBar } from "@/components/admin/filter-bar";
import {
  DataTable,
  EmptyState,
  FlashNotice,
  PageHeader,
  Pagination,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { Button } from "@/components/ui/button";
import { moveLessonAction, setLessonStatusAction } from "@/lib/actions/admin-lessons";
import { requireAdminPage } from "@/lib/admin/auth";
import { listCourseOptions, listLessonRows } from "@/lib/admin/queries";
import { ADMIN_PAGE_SIZE, adminSearchSchema } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola lesson",
  robots: { index: false, follow: false },
};

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = adminSearchSchema.parse({
    q: typeof raw.q === "string" ? raw.q : "",
    status: typeof raw.status === "string" ? raw.status : "all",
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const courseId = typeof raw.courseId === "string" ? raw.courseId : "";

  const { db } = await requireAdminPage("/admin/lessons");
  const [courses, result] = await Promise.all([
    listCourseOptions(db),
    listLessonRows(db, { search: parsed.q, courseId, status: parsed.status, page: parsed.page }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lesson"
        description="Atur materi, urutan, dan status lesson. Arsip mempertahankan riwayat belajar."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Lesson" }]}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/lessons/new">
              <PlusCircle aria-hidden="true" />
              Lesson baru
            </Link>
          </Button>
        }
      />

      {raw.deleted === "1" ? <FlashNotice>Lesson tanpa riwayat berhasil dihapus.</FlashNotice> : null}

      <FilterBar
        action="/admin/lessons"
        query="lessons"
        searchValue={parsed.q}
        placeholder="Cari judul atau slug lesson…"
        resetHref="/admin/lessons"
        selects={[
          {
            name: "courseId",
            label: "Kursus",
            value: courseId,
            options: [
              { value: "", label: "Semua kursus" },
              ...courses.map((course) => ({ value: course.id, label: course.title })),
            ],
          },
          {
            name: "status",
            label: "Status",
            value: parsed.status,
            options: [
              { value: "all", label: "Semua status" },
              { value: "draft", label: "Draft" },
              { value: "published", label: "Terbit" },
              { value: "archived", label: "Arsip" },
            ],
          },
        ]}
      />

      {result.rows.length === 0 ? (
        <EmptyState
          title="Tidak ada lesson yang cocok"
          description="Ubah filter atau buat lesson baru untuk kursus yang sudah ada."
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/lessons/new">Buat lesson</Link>
            </Button>
          }
        />
      ) : (
        <DataTable caption="Daftar lesson">
          <THead>
            <TR>
              <TH>Lesson</TH>
              <TH>Status</TH>
              <TH>Urutan</TH>
              <TH>Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {result.rows.map((lesson) => (
              <TR key={lesson.id}>
                <TD>
                  <Link href={`/admin/lessons/${lesson.id}`} className="font-medium text-ink hover:underline">
                    {lesson.title}
                  </Link>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {lesson.course_title} · {lesson.estimated_minutes} menit · {lesson.required ? "Wajib" : "Opsional"}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-muted">{lesson.slug}</p>
                </TD>
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
                      <QuickAction action={setLessonStatusAction} fields={{ lessonId: lesson.id, status: "archived" }} label="Arsipkan" confirm="Arsipkan lesson ini? Lesson tidak tampil sampai diterbitkan lagi." />
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

      <Pagination
        basePath="/admin/lessons"
        params={{ q: parsed.q, status: parsed.status, courseId }}
        page={parsed.page}
        pageSize={ADMIN_PAGE_SIZE}
        total={result.total}
      />
    </div>
  );
}

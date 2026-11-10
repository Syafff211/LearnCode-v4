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
import { requireAdminPage } from "@/lib/admin/auth";
import { listCourses } from "@/lib/admin/queries";
import { moveCourseAction, setCourseStatusAction } from "@/lib/actions/admin-courses";
import { ADMIN_PAGE_SIZE, adminSearchSchema } from "@/lib/validation/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola kursus",
  robots: { index: false, follow: false },
};

export default async function AdminCoursesPage({
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
  const { db } = await requireAdminPage("/admin/courses");
  const { rows, total } = await listCourses(db, {
    search: parsed.q,
    status: parsed.status,
    page: parsed.page,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kursus"
        description="Buat, sunting, atur urutan, dan ubah status kursus. Kursus yang sudah punya riwayat peserta hanya bisa diarsipkan, tidak dihapus."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Kursus" }]}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/courses/new">
              <PlusCircle aria-hidden="true" />
              Kursus baru
            </Link>
          </Button>
        }
      />

      {raw.deleted === "1" ? <FlashNotice>Kursus tanpa riwayat berhasil dihapus.</FlashNotice> : null}

      <FilterBar
        action="/admin/courses"
        query="courses"
        searchValue={parsed.q}
        placeholder="Cari judul atau slug…"
        resetHref="/admin/courses"
        selects={[
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

      {rows.length === 0 ? (
        <EmptyState
          title={parsed.q || parsed.status !== "all" ? "Tidak ada kursus yang cocok" : "Belum ada kursus"}
          description={
            parsed.q || parsed.status !== "all"
              ? "Ubah kata kunci atau filter status, lalu terapkan lagi."
              : "Mulai dari kursus pertama. Simpan sebagai draft, tambahkan lesson, lalu terbitkan."
          }
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/courses/new">Buat kursus baru</Link>
            </Button>
          }
        />
      ) : (
        <DataTable caption="Daftar kursus">
          <THead>
            <TR>
              <TH>Kursus</TH>
              <TH>Level</TH>
              <TH>Lesson</TH>
              <TH>Peserta</TH>
              <TH>Sertifikat</TH>
              <TH>Status</TH>
              <TH>Urutan</TH>
              <TH>Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((course) => (
              <TR key={course.id}>
                <TD>
                  <Link href={`/admin/courses/${course.id}`} className="font-medium text-ink hover:underline">
                    {course.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">/{course.slug}</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    Diperbarui {formatDateTime(course.updated_at)}
                  </p>
                </TD>
                <TD className="whitespace-nowrap capitalize">
                  {course.level}
                  <span className="ml-1 text-[10px] text-muted">{course.language === "en" ? "EN" : "ID"}</span>
                </TD>
                <TD className="whitespace-nowrap font-mono">{course.lessons_count}</TD>
                <TD className="whitespace-nowrap font-mono">{course.participants}</TD>
                <TD className="whitespace-nowrap font-mono">{course.certificates}</TD>
                <TD>
                  <StatusBadge status={course.status} />
                </TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <QuickAction action={moveCourseAction} fields={{ courseId: course.id, direction: "up" }} label="Naikkan urutan">
                      <ArrowUp aria-hidden="true" />
                    </QuickAction>
                    <QuickAction action={moveCourseAction} fields={{ courseId: course.id, direction: "down" }} label="Turunkan urutan">
                      <ArrowDown aria-hidden="true" />
                    </QuickAction>
                  </div>
                </TD>
                <TD>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/courses/${course.id}`}>Sunting</Link>
                    </Button>
                    {course.status === "published" ? (
                      <QuickAction
                        action={setCourseStatusAction}
                        fields={{ courseId: course.id, status: "archived" }}
                        label="Arsipkan"
                        confirm="Arsipkan kursus ini? Peserta tidak bisa membuka materi sampai kursus diterbitkan lagi."
                      />
                    ) : (
                      <QuickAction
                        action={setCourseStatusAction}
                        fields={{ courseId: course.id, status: "published" }}
                        label="Terbitkan"
                      />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/courses"
        params={{ q: parsed.q, status: parsed.status }}
        page={parsed.page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

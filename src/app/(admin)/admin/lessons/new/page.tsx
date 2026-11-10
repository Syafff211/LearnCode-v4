import type { Metadata } from "next";
import Link from "next/link";

import { LessonForm } from "@/components/admin/lesson-form";
import { EmptyState, PageHeader } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { createLessonAction } from "@/lib/actions/admin-lessons";
import { requireAdminPage } from "@/lib/admin/auth";
import { listCourseOptions } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lesson baru",
  robots: { index: false, follow: false },
};

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const { db } = await requireAdminPage("/admin/lessons/new");
  const courses = await listCourseOptions(db);
  const defaultCourseId = typeof raw.courseId === "string" ? raw.courseId : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lesson baru"
        description="Tulis materi, contoh kode, dan latihan. Simpan sebagai draft dulu, periksa pratinjau, lalu terbitkan."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Lesson", href: "/admin/lessons" },
          { label: "Baru" },
        ]}
      />

      {courses.length === 0 ? (
        <EmptyState
          title="Belum ada kursus"
          description="Lesson harus berada di dalam kursus. Buat kursus dulu, lalu kembali ke halaman ini."
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/courses/new">Buat kursus</Link>
            </Button>
          }
        />
      ) : (
        <LessonForm
          action={createLessonAction}
          courses={courses.map((course) => ({ id: course.id, title: course.title, slug: course.slug }))}
          defaultCourseId={defaultCourseId}
        />
      )}
    </div>
  );
}

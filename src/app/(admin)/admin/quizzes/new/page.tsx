import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/admin/primitives";
import { QuizForm } from "@/components/admin/quiz-form";
import { Button } from "@/components/ui/button";
import { createQuizAction } from "@/lib/actions/admin-quizzes";
import { requireAdminPage } from "@/lib/admin/auth";
import { listCourseOptions } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quiz baru",
  robots: { index: false, follow: false },
};

export default async function NewQuizPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const { db } = await requireAdminPage("/admin/quizzes/new");
  const courses = await listCourseOptions(db);
  const defaultCourseId = typeof raw.courseId === "string" ? raw.courseId : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quiz baru"
        description="Quiz dinilai sepenuhnya di server. Peserta tidak pernah menerima kunci jawaban sebelum mengumpulkan."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quiz", href: "/admin/quizzes" },
          { label: "Baru" },
        ]}
      />
      {courses.length === 0 ? (
        <EmptyState
          title="Belum ada kursus"
          description="Quiz terikat ke satu kursus. Buat kursus lebih dahulu."
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/courses/new">Buat kursus</Link>
            </Button>
          }
        />
      ) : (
        <QuizForm
          action={createQuizAction}
          courses={courses.map((course) => ({ id: course.id, title: course.title, passing_score: course.passing_score }))}
          defaultCourseId={defaultCourseId}
        />
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/primitives";
import { QuestionForm } from "@/components/admin/question-form";
import { createQuestionAction } from "@/lib/actions/admin-quizzes";
import { requireAdminPage } from "@/lib/admin/auth";
import { getQuizDetail } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pertanyaan baru",
  robots: { index: false, follow: false },
};

export default async function NewQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireAdminPage(`/admin/quizzes/${id}/questions/new`);
  const detail = await getQuizDetail(db, id);
  if (!detail) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pertanyaan baru"
        description={`Untuk quiz "${detail.quiz.title}" · ${detail.course.title}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quiz", href: "/admin/quizzes" },
          { label: detail.quiz.title, href: `/admin/quizzes/${id}` },
          { label: "Pertanyaan baru" },
        ]}
      />
      <QuestionForm action={createQuestionAction} quizId={id} cancelHref={`/admin/quizzes/${id}`} />
    </div>
  );
}

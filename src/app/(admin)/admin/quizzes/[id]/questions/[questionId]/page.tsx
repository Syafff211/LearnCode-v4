import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/primitives";
import { QuestionForm } from "@/components/admin/question-form";
import { deleteQuestionAction, updateQuestionAction } from "@/lib/actions/admin-quizzes";
import { requireAdminPage } from "@/lib/admin/auth";
import { getQuestionDetail } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sunting pertanyaan",
  robots: { index: false, follow: false },
};

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>;
}) {
  const { id, questionId } = await params;
  const { db } = await requireAdminPage(`/admin/quizzes/${id}/questions/${questionId}`);
  const question = await getQuestionDetail(db, questionId);
  if (!question || question.quizId !== id) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sunting pertanyaan"
        description={`Quiz "${question.quizTitle}" · urutan ${question.position}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quiz", href: "/admin/quizzes" },
          { label: question.quizTitle, href: `/admin/quizzes/${id}` },
          { label: "Sunting pertanyaan" },
        ]}
      />

      <QuestionForm
        action={updateQuestionAction}
        quizId={id}
        cancelHref={`/admin/quizzes/${id}`}
        question={{
          id: question.id,
          quizId: question.quizId,
          prompt: question.prompt,
          code: question.code ?? "",
          codeLanguage: question.code_language ?? "html",
          options: question.options,
          correctOptionId: question.correct_option_id,
          explanation: question.explanation,
          weight: question.weight,
        }}
      />

      <section className="rounded-[8px] border border-danger/30 bg-danger-soft/40 p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Hapus pertanyaan</h2>
        <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-soft">
          Hanya bisa dilakukan bila quiz belum pernah dikerjakan. Bila sudah ada percobaan,
          ubah pertanyaannya tanpa menghapus bukti penilaian.
        </p>
        <div className="mt-3">
          <ConfirmAction
            action={deleteQuestionAction}
            fields={{ questionId: question.id }}
            title="Hapus pertanyaan ini?"
            description="Tindakan ini permanen dan akan mengubah komposisi quiz untuk percobaan berikutnya."
            triggerLabel="Hapus pertanyaan"
            confirmLabel="Hapus permanen"
          />
        </div>
      </section>
    </div>
  );
}

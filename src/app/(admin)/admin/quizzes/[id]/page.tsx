import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, PlusCircle } from "lucide-react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import {
  DataTable,
  EmptyState,
  FlashNotice,
  PageHeader,
  Pagination,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { QuizForm } from "@/components/admin/quiz-form";
import { Button } from "@/components/ui/button";
import {
  deleteQuestionAction,
  moveQuestionAction,
  updateQuizAction,
} from "@/lib/actions/admin-quizzes";
import { requireAdminPage } from "@/lib/admin/auth";
import { getQuizAttemptSummary, getQuizDetail, listCourseOptions } from "@/lib/admin/queries";
import { ADMIN_PAGE_SIZE } from "@/lib/validation/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola quiz",
  robots: { index: false, follow: false },
};

export default async function QuizDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const attemptPage = Math.max(1, Number(typeof query.attemptPage === "string" ? query.attemptPage : "1") || 1);

  const { db } = await requireAdminPage(`/admin/quizzes/${id}`);
  const detail = await getQuizDetail(db, id);
  if (!detail) notFound();

  const [courses, attempts] = await Promise.all([
    listCourseOptions(db),
    getQuizAttemptSummary(db, id, attemptPage),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.quiz.title}
        description={`Quiz akhir untuk ${detail.course.title}.`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Quiz", href: "/admin/quizzes" },
          { label: detail.quiz.title },
        ]}
        actions={
          <>
            <Button asChild size="sm" variant="secondary">
              <Link href={`/admin/quizzes/${id}/questions/new`}>
                <PlusCircle aria-hidden="true" />
                Pertanyaan baru
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/courses/${detail.course.id}`}>Lihat kursus</Link>
            </Button>
          </>
        }
      />

      {query.created === "1" ? <FlashNotice>Quiz dibuat. Tambahkan pertanyaan sebelum dipakai.</FlashNotice> : null}

      <section className="grid gap-3 rounded-[8px] border border-line bg-surface p-4 text-[0.8125rem] sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Pertanyaan</p>
          <p className="mt-1 font-mono text-lg text-ink">{detail.questions.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Percobaan</p>
          <p className="mt-1 font-mono text-lg text-ink">{attempts?.summary.attempts ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Peserta</p>
          <p className="mt-1 font-mono text-lg text-ink">{attempts?.summary.participants ?? 0}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Rata-rata skor</p>
          <p className="mt-1 font-mono text-lg text-ink">{attempts?.summary.average_score ?? 0}%</p>
        </div>
      </section>

      <QuizForm
        action={updateQuizAction}
        courses={courses.map((course) => ({
          id: course.id,
          title: course.title,
          passing_score: course.passing_score,
        }))}
        quiz={{
          id: detail.quiz.id,
          courseId: detail.quiz.course_id,
          title: detail.quiz.title,
          description: detail.quiz.description,
          passingScore: detail.quiz.passing_score,
          required: detail.quiz.required,
        }}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Pertanyaan</h2>
            <p className="text-xs text-muted">
              Kunci jawaban tetap di server. Bobot menentukan kontribusi soal terhadap skor akhir.
            </p>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/quizzes/${id}/questions/new`}>Tambah pertanyaan</Link>
          </Button>
        </div>

        {detail.questions.length === 0 ? (
          <EmptyState
            title="Belum ada pertanyaan"
            description="Quiz tanpa pertanyaan tidak bisa dinilai. Tambahkan minimal satu pertanyaan dengan dua opsi dan satu jawaban benar."
            action={
              <Button asChild size="sm" variant="secondary">
                <Link href={`/admin/quizzes/${id}/questions/new`}>Tulis pertanyaan</Link>
              </Button>
            }
          />
        ) : (
          <DataTable caption="Pertanyaan quiz">
            <THead>
              <TR>
                <TH>#</TH>
                <TH>Pertanyaan</TH>
                <TH>Opsi</TH>
                <TH>Bobot</TH>
                <TH>Urutan</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {detail.questions.map((question) => (
                <TR key={question.id}>
                  <TD className="font-mono text-[11px] text-muted">{question.position}</TD>
                  <TD className="max-w-[22rem]">
                    <Link
                      href={`/admin/quizzes/${id}/questions/${question.id}`}
                      className="line-clamp-2 font-medium text-ink hover:underline"
                    >
                      {question.prompt}
                    </Link>
                    {question.code ? (
                      <p className="mt-0.5 font-mono text-[10px] text-muted">{question.code_language} · ada potongan kode</p>
                    ) : null}
                  </TD>
                  <TD className="font-mono text-[11px]">{Array.isArray(question.options) ? question.options.length : 0}</TD>
                  <TD className="font-mono">{question.weight}</TD>
                  <TD>
                    <div className="flex items-center gap-1">
                      <QuickAction action={moveQuestionAction} fields={{ questionId: question.id, direction: "up" }} label="Naikkan">
                        <ArrowUp aria-hidden="true" />
                      </QuickAction>
                      <QuickAction action={moveQuestionAction} fields={{ questionId: question.id, direction: "down" }} label="Turunkan">
                        <ArrowDown aria-hidden="true" />
                      </QuickAction>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/quizzes/${id}/questions/${question.id}`}>Sunting</Link>
                      </Button>
                      <ConfirmAction
                        action={deleteQuestionAction}
                        fields={{ questionId: question.id }}
                        title="Hapus pertanyaan ini?"
                        description="Server menolak penghapusan bila quiz sudah punya percobaan, agar bukti penilaian lama tidak hilang."
                        triggerLabel="Hapus"
                        confirmLabel="Hapus pertanyaan"
                      />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Hasil percobaan</h2>
          <p className="text-xs text-muted">Skor tercatat saat peserta mengumpulkan; perubahan aturan tidak menulis ulang riwayat.</p>
        </div>

        {(attempts?.attempts.length ?? 0) === 0 ? (
          <EmptyState
            title="Belum ada percobaan"
            description="Setelah peserta mengerjakan quiz, hasilnya akan muncul di sini beserta skor dan status kelulusan."
          />
        ) : (
          <>
            <DataTable caption="Percobaan quiz">
              <THead>
                <TR>
                  <TH>Peserta</TH>
                  <TH>Skor</TH>
                  <TH>Benar</TH>
                  <TH>Status</TH>
                  <TH>Waktu</TH>
                </TR>
              </THead>
              <TBody>
                {attempts?.attempts.map((attempt) => (
                  <TR key={attempt.id}>
                    <TD>
                      <p className="text-ink">{attempt.full_name || "Tanpa nama"}</p>
                      <p className="text-[10px] text-muted">{attempt.email || "—"}</p>
                    </TD>
                    <TD className="font-mono">{attempt.score}%</TD>
                    <TD className="font-mono">
                      {attempt.correct_count}/{attempt.question_count}
                    </TD>
                    <TD>
                      <span className={attempt.passed ? "text-ok" : "text-danger"}>
                        {attempt.passed ? "Lulus" : "Belum lulus"}
                      </span>
                    </TD>
                    <TD className="whitespace-nowrap text-[11px] text-muted">{formatDateTime(attempt.created_at)}</TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
            <Pagination
              basePath={`/admin/quizzes/${id}`}
              params={{ attemptPage: String(attemptPage) }}
              page={attemptPage}
              pageSize={ADMIN_PAGE_SIZE}
              total={attempts?.summary.attempts ?? 0}
            />
          </>
        )}
      </section>
    </div>
  );
}

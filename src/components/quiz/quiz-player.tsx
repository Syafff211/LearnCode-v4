"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, Check, CircleAlert, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Progress } from "@/components/ui/progress";
import type { SanitizedQuiz } from "@/lib/data/quiz";
import { cn, formatScore } from "@/lib/utils";

type GradedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
  explanation: string;
};

type SubmissionResult = {
  score: number;
  passed: boolean;
  correctCount: number;
  questionCount: number;
  bestScore: number | null;
  attemptsCount: number;
  passingScore: number;
  results: GradedAnswer[];
  certificate: {
    certificateNumber: string;
    verificationPath: string;
    finalScore: number;
  } | null;
};

export function QuizPlayer({
  quiz,
  course,
  initialAttempts,
}: {
  quiz: SanitizedQuiz;
  course: { slug: string; title: string };
  initialAttempts: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<SubmissionResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.questions.length;

  const resultByQuestion = React.useMemo(() => {
    const map = new Map<string, GradedAnswer>();
    for (const entry of result?.results ?? []) map.set(entry.questionId, entry);
    return map;
  }, [result]);

  async function submit() {
    if (pending) return;
    if (!allAnswered) {
      setError("Jawab semua pertanyaan sebelum mengirim.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        toast.error("Sesi kamu berakhir. Silakan masuk kembali.");
        router.push(`/login?next=${encodeURIComponent(`/courses/${course.slug}/quiz`)}`);
        return;
      }
      if (!response.ok) {
        setError(
          payload?.error?.message ??
            "Jawaban belum bisa dinilai sekarang. Periksa koneksi lalu coba lagi.",
        );
        return;
      }

      const data = payload as SubmissionResult;
      setResult(data);
      setAnswers({});
      toast[data.passed ? "success" : "warning"](
        data.passed ? "Quiz lulus" : "Quiz belum lulus",
        { description: `Nilai ${data.score}% · syarat ${data.passingScore}%` },
      );
      if (data.certificate) {
        toast.success("Sertifikat diterbitkan", {
          description: "Semua syarat kursus terpenuhi.",
        });
      }
      router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Koneksi terputus. Periksa jaringan lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  function retry() {
    setResult(null);
    setAnswers({});
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {result ? (
          <section aria-labelledby="hasil-heading" className="mb-8">
            <div className="rounded-[8px] border border-line bg-surface p-5 sm:p-6">
              <p className="eyebrow">Hasil quiz</p>
              <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                <h2 id="hasil-heading" className="display-title">
                  {result.passed ? "Kamu lulus." : "Belum memenuhi passing score."}
                </h2>
                <span
                  className={cn(
                    "rounded-[4px] px-2 py-0.5 font-mono text-xs",
                    result.passed ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger",
                  )}
                >
                  {result.score}%
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {result.correctCount} dari {result.questionCount} jawaban benar · passing score{" "}
                {result.passingScore}% · percobaan ke-{result.attemptsCount}
                {result.bestScore !== null
                  ? ` · nilai terbaik ${formatScore(result.bestScore)}`
                  : ""}
              </p>

              {result.certificate ? (
                <Callout tone="success" title="Sertifikat diterbitkan" className="mt-4">
                  <p>Semua syarat kursus terpenuhi dan sertifikat sudah tersimpan di akunmu.</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Link
                      href={`/certificates/${result.certificate.certificateNumber}`}
                      className="inline-flex items-center gap-1.5 font-medium text-accent-text"
                    >
                      <Award className="size-3.5" aria-hidden="true" />
                      Buka sertifikat
                    </Link>
                    <Link
                      href={result.certificate.verificationPath}
                      className="inline-flex items-center gap-1.5 text-accent-text"
                    >
                      Halaman verifikasi publik
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </Callout>
              ) : !result.passed ? (
                <Callout tone="warning" className="mt-4">
                  Baca ulang penjelasan di bawah, lalu coba lagi. Percobaan tidak dibatasi dan
                  nilai terbaik yang dipakai untuk sertifikat.
                </Callout>
              ) : (
                <Callout tone="info" className="mt-4">
                  Quiz lulus, tetapi sertifikat baru diterbitkan setelah semua lesson ditandai
                  selesai.{" "}
                  <Link href={`/courses/${course.slug}`} className="font-medium text-accent-text">
                    Lihat progress kursus
                  </Link>
                  .
                </Callout>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={retry}>
                  <RotateCcw aria-hidden="true" />
                  Coba lagi
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/courses/${course.slug}`}>Kembali ke kursus</Link>
                </Button>
                {initialAttempts + 1 > 1 ? (
                  <Button asChild variant="ghost">
                    <Link href="/dashboard">Lihat dashboard</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <ol className="space-y-6">
          {quiz.questions.map((question, index) => {
            const graded = resultByQuestion.get(question.id);
            return (
              <li key={question.id}>
                <fieldset
                  disabled={Boolean(result) || pending}
                  className="rounded-[8px] border border-line bg-surface p-5 disabled:opacity-100"
                >
                  <legend className="sr-only">
                    Pertanyaan {index + 1} dari {quiz.questions.length}
                  </legend>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                      Pertanyaan {String(index + 1).padStart(2, "0")}
                    </p>
                    {graded ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 font-mono text-[10px]",
                          graded.correct ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger",
                        )}
                      >
                        {graded.correct ? (
                          <Check className="size-2.5" aria-hidden="true" />
                        ) : (
                          <X className="size-2.5" aria-hidden="true" />
                        )}
                        {graded.correct ? "benar" : "salah"}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-[0.9375rem] font-medium leading-relaxed text-ink">
                    {question.prompt}
                  </p>

                  {question.code ? (
                    <pre className="mt-3 overflow-x-auto rounded-[5px] border border-code-line bg-code-bg p-3 font-mono text-[12px] leading-relaxed text-ink-soft">
                      <code>{question.code}</code>
                    </pre>
                  ) : null}

                  <div className="mt-4 space-y-2">
                    {question.options.map((option) => {
                      const isSelected = graded
                        ? graded.selectedOptionId === option.id
                        : answers[question.id] === option.id;
                      const isCorrect = graded ? graded.correctOptionId === option.id : false;
                      const isWrongPick = Boolean(graded) && isSelected && !graded?.correct;

                      return (
                        <label
                          key={option.id}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-[6px] border p-3 text-sm leading-relaxed transition-colors",
                            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-text has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas",
                            graded
                              ? isCorrect
                                ? "border-ok/50 bg-ok-soft text-ink"
                                : isWrongPick
                                  ? "border-danger/40 bg-danger-soft text-ink"
                                  : "border-line bg-surface text-muted"
                              : isSelected
                                ? "border-accent/60 bg-accent-soft text-ink"
                                : "border-line bg-surface text-ink-soft hover:border-line-strong",
                            (graded || pending) && "cursor-default",
                          )}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option.id}
                            checked={isSelected}
                            onChange={() =>
                              setAnswers((current) => ({ ...current, [question.id]: option.id }))
                            }
                            className="mt-0.5 size-3.5 shrink-0 accent-[var(--lc-accent)]"
                          />
                          <span className="flex-1">{option.text}</span>
                          {graded && isCorrect ? (
                            <Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden="true" />
                          ) : null}
                          {isWrongPick ? (
                            <X className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />
                          ) : null}
                        </label>
                      );
                    })}
                  </div>

                  {graded ? (
                    <div className="mt-3 rounded-[5px] border border-line bg-surface-2/70 p-3 text-xs leading-relaxed text-ink-soft">
                      <span className="font-medium text-ink">Penjelasan. </span>
                      {graded.explanation}
                    </div>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>

        {error ? (
          <Callout tone="danger" className="mt-5">
            <span className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </span>
          </Callout>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={submit} disabled={Boolean(result)} loading={pending}>
            {allAnswered
              ? "Kirim jawaban"
              : `Jawab ${quiz.questions.length - answeredCount} pertanyaan lagi`}
          </Button>
          <span className="font-mono text-[10px] text-muted">
            {answeredCount}/{quiz.questions.length} terjawab
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          Jawaban dinilai di server. Kunci jawaban tidak pernah dikirim ke browser sebelum kamu
          mengirim jawaban.
        </p>
      </div>

      <aside className="lg:col-span-4">
        <div className="rounded-[8px] border border-line bg-surface p-5 lg:sticky lg:top-24">
          <p className="eyebrow">Ringkasan</p>
          <p className="mt-2 text-sm font-medium text-ink">{quiz.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{quiz.description}</p>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Jumlah soal</dt>
              <dd className="font-mono text-ink-soft">{quiz.questions.length}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Passing score</dt>
              <dd className="font-mono text-ink-soft">{quiz.passingScore}%</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Percobaan</dt>
              <dd className="font-mono text-ink-soft">tak dibatasi</dd>
            </div>
          </dl>
          <div className="mt-4">
            <Progress
              value={(answeredCount / quiz.questions.length) * 100}
              label="Jumlah soal terjawab"
            />
            <p className="mt-1.5 font-mono text-[10px] text-muted">
              {answeredCount}/{quiz.questions.length} soal terjawab
            </p>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
            Nilai terbaik dari semua percobaan yang dipakai untuk sertifikat. Setiap percobaan
            tersimpan di akunmu.
          </p>
        </div>
      </aside>
    </div>
  );
}

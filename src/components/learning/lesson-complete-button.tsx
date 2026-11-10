"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, Check, CircleAlert, FileQuestion } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Progress } from "@/components/ui/progress";

type CompletionResponse = {
  progress: { completedLessons: number; totalLessons: number; percent: number };
  eligibility: {
    eligible: boolean;
    completedLessons: number;
    totalLessons: number;
    requirements: { key: string; label: string; met: boolean; detail: string }[];
  };
  certificate: {
    certificateNumber: string;
    verificationPath: string;
    finalScore: number;
  } | null;
};

export function LessonCompleteButton({
  lessonId,
  completed,
  nextHref,
  courseHref,
  quizHref,
  quizAttempted,
  certificateNumber,
}: {
  lessonId: string;
  completed: boolean;
  nextHref: string | null;
  courseHref: string;
  quizHref: string | null;
  quizAttempted: boolean;
  certificateNumber: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [justCompleted, setJustCompleted] = React.useState(false);
  const [result, setResult] = React.useState<CompletionResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  // Server data wins after `router.refresh()`; the local flag keeps the button
  // in its completed state while the refresh is in flight.
  const done = completed || justCompleted;

  async function markComplete() {
    if (pending || done) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        toast.error("Sesi kamu berakhir. Silakan masuk kembali.");
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) {
        setError(payload?.error?.message ?? "Progress belum bisa disimpan. Coba lagi.");
        return;
      }

      const data = payload as CompletionResponse;
      setResult(data);
      setJustCompleted(true);
      toast.success("Lesson ditandai selesai", {
        description: data.progress
          ? `${data.progress.completedLessons} dari ${data.progress.totalLessons} lesson selesai.`
          : undefined,
      });
      if (data.certificate) {
        toast.success("Sertifikat diterbitkan", {
          description: "Semua syarat kursus terpenuhi.",
          action: {
            label: "Lihat",
            onClick: () => router.push(`/certificates/${data.certificate?.certificateNumber}`),
          },
        });
      }
      router.refresh();
    } catch {
      setError("Koneksi terputus. Periksa jaringan lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  const allDone = result
    ? result.eligibility.completedLessons >= result.eligibility.totalLessons
    : false;
  const certificate = result?.certificate ?? null;

  return (
    <section aria-labelledby="selesai-heading" className="mt-10 border-t border-line pt-8">
      <div className="rounded-[8px] border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Penyelesaian lesson</p>
            <h2 id="selesai-heading" className="display-title mt-2">
              {done ? "Lesson ini sudah selesai." : "Sudah bisa menjelaskan materinya?"}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Penandaan selesai bersifat eksplisit dan disimpan di server. Membuka
              halaman ini tidak otomatis menandainya selesai.
            </p>
          </div>
          {done ? (
            <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-ok-soft px-2.5 py-1 text-xs font-medium text-ok">
              <Check className="size-3.5" aria-hidden="true" />
              Selesai
            </span>
          ) : null}
        </div>

        {result ? (
          <div className="mt-4">
            <Progress
              value={result.progress.percent}
              label="Progress kursus setelah penyelesaian"
            />
            <p className="mt-1.5 font-mono text-[10px] text-muted">
              {result.progress.completedLessons}/{result.progress.totalLessons} lesson ·{" "}
              {result.progress.percent}%
            </p>
          </div>
        ) : null}

        {error ? (
          <Callout tone="danger" className="mt-4">
            {error}
          </Callout>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            onClick={markComplete}
            disabled={done || pending}
            loading={pending}
            aria-describedby="complete-hint"
          >
            {done ? (
              <>
                <Check aria-hidden="true" />
                Lesson selesai
              </>
            ) : (
              "Tandai lesson selesai"
            )}
          </Button>
          {nextHref ? (
            <Button asChild variant="secondary">
              <Link href={nextHref}>
                Lesson berikutnya
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          ) : quizHref ? (
            <Button asChild variant="secondary">
              <Link href={quizHref}>
                <FileQuestion aria-hidden="true" />
                Kerjakan quiz
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="sm:ml-auto">
            <Link href={courseHref}>Kembali ke kursus</Link>
          </Button>
        </div>
        <p id="complete-hint" className="mt-2 text-[11px] text-muted">
          Kamu tetap bisa membuka lesson ini lagi kapan saja.
        </p>

        {certificate ? (
          <Callout tone="success" title="Sertifikat diterbitkan" className="mt-5">
            <p>
              Seluruh syarat kursus terpenuhi. Nilai akhir{" "}
              {certificate.finalScore}% dan sertifikat sudah tersimpan di akunmu.
            </p>
            <Link
              href={`/certificates/${certificate.certificateNumber}`}
              className="mt-2 inline-flex items-center gap-1.5 font-medium text-accent-text"
            >
              <Award className="size-3.5" aria-hidden="true" />
              Lihat sertifikat
            </Link>
          </Callout>
        ) : done && allDone && quizHref && !quizAttempted ? (
          <Callout tone="info" title="Langkah berikutnya: quiz" className="mt-5">
            Semua lesson selesai. Kerjakan{" "}
            <Link href={quizHref} className="font-medium text-accent-text">
              quiz akhir kursus
            </Link>{" "}
            untuk memenuhi syarat sertifikat.
          </Callout>
        ) : done && certificateNumber ? (
          <p className="mt-4 text-xs text-muted">
            Sertifikat kursus ini sudah terbit.{" "}
            <Link
              href={`/certificates/${certificateNumber}`}
              className="text-accent-text underline-offset-2 hover:underline"
            >
              Buka sertifikat
            </Link>
            .
          </p>
        ) : done && allDone && quizAttempted && !certificate ? (
          <Callout tone="warning" title="Quiz belum memenuhi passing score" className="mt-5">
            <span className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-highlight" aria-hidden="true" />
              <span>
                Kamu sudah mencoba quiz, tetapi nilai terbaik belum mencapai
                passing score. Buka{" "}
                {quizHref ? (
                  <Link href={quizHref} className="font-medium text-accent-text">
                    halaman quiz
                  </Link>
                ) : (
                  "halaman quiz"
                )}{" "}
                untuk mencoba lagi.
              </span>
            </span>
          </Callout>
        ) : null}
      </div>
    </section>
  );
}

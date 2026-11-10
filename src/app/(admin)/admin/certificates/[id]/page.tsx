import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";

import { ConfirmAction } from "@/components/admin/confirm-action";
import {
  DataTable,
  FlashNotice,
  PageHeader,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { revokeCertificateAction } from "@/lib/actions/admin-governance";
import { requireAdminPage } from "@/lib/admin/auth";
import { listCertificateRows } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail sertifikat",
  robots: { index: false, follow: false },
};

export default async function AdminCertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db } = await requireAdminPage(`/admin/certificates/${id}`);

  const { data: certificate } = await db
    .from("certificates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!certificate) notFound();

  const userId = certificate.user_id as string;
  const courseId = certificate.course_id as string;

  const [{ data: course }, { data: lessons }, { data: progress }, { data: quiz }, { data: attempts }] =
    await Promise.all([
      db.from("courses").select("id, title, slug, passing_score, require_all_lessons, status").eq("id", courseId).maybeSingle(),
      db.from("lessons").select("id, required, status, title").eq("course_id", courseId),
      db.from("lesson_progress").select("lesson_id").eq("user_id", userId).eq("course_id", courseId),
      db.from("quizzes").select("id, passing_score, required, title").eq("course_id", courseId).maybeSingle(),
      db
        .from("quiz_attempts")
        .select("score, passed, created_at")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const { data: profile } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const emailRows = await listCertificateRows(db, {
    search: String(certificate.certificate_number),
    status: "all",
    page: 1,
  });
  const email = emailRows.rows.find((row) => row.id === id)?.recipient_email ?? "";

  const relevantLessons = (lessons ?? []).filter(
    (lesson) => lesson.status === "published" && (course?.require_all_lessons === false ? false : lesson.required),
  );
  const completedIds = new Set((progress ?? []).map((row) => row.lesson_id as string));
  const completedRelevant = relevantLessons.filter((lesson) => completedIds.has(lesson.id as string)).length;
  const bestScore =
    attempts && attempts.length > 0
      ? attempts.reduce((max, row) => Math.max(max, Number(row.score) || 0), 0)
      : null;
  const revoked = Boolean(certificate.revoked_at);

  return (
    <div className="space-y-6">
      <PageHeader
        title={certificate.certificate_number as string}
        description={`${certificate.recipient_name} · ${certificate.course_title_snapshot}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Sertifikat", href: "/admin/certificates" },
          { label: certificate.certificate_number as string },
        ]}
        actions={
          <>
            <StatusBadge status={revoked ? "revoked" : "valid"} />
            <Button asChild size="sm" variant="secondary">
              <a href={`/api/admin/certificates/${id}/pdf`} target="_blank" rel="noreferrer">
                <Download aria-hidden="true" />
                Unduh PDF
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href={`/verify/${certificate.verification_code}`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" />
                Halaman verifikasi
              </Link>
            </Button>
          </>
        }
      />

      {revoked ? (
        <FlashNotice tone="error">
          Sertifikat ini dicabut pada {formatDateTime(certificate.revoked_at as string)}.
          {certificate.revocation_reason ? ` Alasan: ${certificate.revocation_reason}` : ""} Baris
          sertifikat tetap ada dan halaman verifikasi publik menampilkan status tidak berlaku.
        </FlashNotice>
      ) : (
        <FlashNotice tone="warning">
          Pencabutan hanya untuk kasus yang sah: penerbitan keliru, pelanggaran akademik, atau
          permintaan pemilik akun. Tindakan ini tidak bisa dibatalkan dan tercatat di log audit.
        </FlashNotice>
      )}

      <section className="grid gap-4 rounded-[8px] border border-line bg-surface p-4 sm:grid-cols-2 sm:p-5">
        <dl className="space-y-2 text-[0.8125rem]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Penerima</dt>
            <dd className="text-right text-ink">{certificate.recipient_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Email akun</dt>
            <dd className="text-right text-ink-soft">{email || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Nama profil saat ini</dt>
            <dd className="text-right text-ink-soft">{(profile?.full_name as string) || "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Kursus</dt>
            <dd className="text-right text-ink-soft">{certificate.course_title_snapshot}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Nilai akhir tercatat</dt>
            <dd className="text-right font-mono text-ink">{certificate.final_score}%</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Diterbitkan</dt>
            <dd className="text-right text-ink-soft">{formatDateTime(certificate.issued_at as string)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Kode verifikasi</dt>
            <dd className="break-all text-right font-mono text-[11px] text-ink-soft">
              {certificate.verification_code}
            </dd>
          </div>
        </dl>

        <div>
          <h2 className="text-[0.8125rem] font-medium text-ink">Pemeriksaan syarat kelulusan (kondisi saat ini)</h2>
          <ul className="mt-2 space-y-1.5 text-[0.8125rem] text-ink-soft">
            <li>
              {course?.require_all_lessons === false ? (
                <>
                  Lesson wajib: <span className="text-muted">tidak diwajibkan oleh kursus ini</span>
                </>
              ) : (
                <>
                  Lesson relevan selesai:{" "}
                  <span className="font-mono">
                    {completedRelevant}/{relevantLessons.length}
                  </span>{" "}
                  {relevantLessons.length > 0 && completedRelevant >= relevantLessons.length ? (
                    <span className="text-ok">· terpenuhi</span>
                  ) : (
                    <span className="text-muted">· belum lengkap</span>
                  )}
                </>
              )}
            </li>
            <li>
              Quiz: <span className="text-ink-soft">{quiz?.title ?? "tidak ada"}</span>
              {quiz ? (
                <span className="text-muted">
                  {" "}
                  · ambang saat ini {quiz.passing_score}%
                </span>
              ) : null}
            </li>
            <li>
              Skor terbaik tercatat:{" "}
              <span className="font-mono">{bestScore === null ? "—" : `${bestScore}%`}</span>
              {bestScore !== null && quiz ? (
                bestScore >= Number(quiz.passing_score) ? (
                  <span className="text-ok"> · lulus ambang sekarang</span>
                ) : (
                  <span className="text-muted"> · di bawah ambang sekarang</span>
                )
              ) : null}
            </li>
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Syarat bisa berubah setelah sertifikat terbit. Sertifikat yang sudah diterbitkan
            tetap berlaku sampai dicabut secara eksplisit; perubahan materi atau bobot tidak
            membatalkannya.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Riwayat percobaan quiz</h2>
        <DataTable caption="Percobaan quiz penerima">
          <THead>
            <TR>
              <TH>Skor</TH>
              <TH>Status</TH>
              <TH>Waktu</TH>
            </TR>
          </THead>
          <TBody>
            {attempts && attempts.length > 0 ? (
              attempts.map((attempt, index) => (
                <TR key={index}>
                  <TD className="font-mono">{attempt.score}%</TD>
                  <TD className={attempt.passed ? "text-ok" : "text-danger"}>
                    {attempt.passed ? "Lulus" : "Belum lulus"}
                  </TD>
                  <TD className="text-[11px] text-muted">{formatDateTime(attempt.created_at as string)}</TD>
                </TR>
              ))
            ) : (
              <TR>
                <TD>{course?.title ?? "Kursus"}</TD>
                <TD className="text-muted">Tidak ada percobaan tercatat</TD>
                <TD>—</TD>
              </TR>
            )}
          </TBody>
        </DataTable>
      </section>

      {!revoked ? (
        <section className="rounded-[8px] border border-danger/30 bg-danger-soft/40 p-4 sm:p-5">
          <h2 className="font-display text-base font-semibold text-ink">Cabut sertifikat</h2>
          <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-soft">
            Setelah dicabut, halaman verifikasi publik menunjukkan sertifikat tidak berlaku.
            Data penerbitan, nomor, dan riwayat percobaan tetap tersimpan.
          </p>
          <div className="mt-3">
            <ConfirmAction
              action={revokeCertificateAction}
              fields={{ certificateId: id }}
              title={`Cabut ${certificate.certificate_number}?`}
              description="Tindakan ini permanen dan akan tercatat pada log audit bersama alasannya."
              triggerLabel="Cabut sertifikat"
              confirmLabel="Cabut sekarang"
              reasonLabel="Alasan pencabutan (wajib, tersimpan permanen)"
              reasonRequired
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

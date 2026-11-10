import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmAction } from "@/components/admin/confirm-action";
import {
  DataTable,
  EmptyState,
  FlashNotice,
  PageHeader,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { reactivateUserAction, suspendUserAction } from "@/lib/actions/admin-governance";
import { requireAdminPage } from "@/lib/admin/auth";
import { getUserDetail } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail pengguna",
  robots: { index: false, follow: false },
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db, profile: adminProfile } = await requireAdminPage(`/admin/users/${id}`);
  const detail = await getUserDetail(db, id);
  if (!detail) notFound();

  const { user, courses, attempts, certificates } = detail;
  const isSelf = adminProfile.id === user.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.full_name || "Tanpa nama"}
        description={user.email || "Email tidak tersedia pada catatan profil."}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Pengguna", href: "/admin/users" },
          { label: user.full_name || "Detail" },
        ]}
        actions={
          <>
            <StatusBadge status={user.suspended_at ? "suspended" : "active"} />
            <StatusBadge status={user.role} />
          </>
        }
      />

      <section className="grid gap-3 rounded-[8px] border border-line bg-surface p-4 text-[0.8125rem] sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Terdaftar</p>
          <p className="mt-1 text-ink">{formatDateTime(user.created_at)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Kursus dimulai</p>
          <p className="mt-1 font-mono text-lg text-ink">{courses.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Sertifikat</p>
          <p className="mt-1 font-mono text-lg text-ink">{certificates.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Bahasa</p>
          <p className="mt-1 text-ink">{user.preferred_language === "en" ? "English" : "Indonesia"}</p>
        </div>
      </section>

      {user.suspended_at ? (
        <FlashNotice tone="warning">
          Akun dinonaktifkan pada {formatDateTime(user.suspended_at)}
          {user.suspended_reason ? ` dengan alasan: ${user.suspended_reason}` : "."} Sesi
          berikutnya ditolak saat memuat data atau memanggil API.
        </FlashNotice>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Progress kursus</h2>
        {courses.length === 0 ? (
          <EmptyState
            title="Belum ada aktivitas belajar"
            description="Pengguna ini belum menyelesaikan lesson atau mengerjakan quiz." 
          />
        ) : (
          <DataTable caption="Progress kursus pengguna">
            <THead>
              <TR>
                <TH>Kursus</TH>
                <TH>Lesson</TH>
                <TH>Skor terbaik</TH>
                <TH>Sertifikat</TH>
              </TR>
            </THead>
            <TBody>
              {courses.map((course) => (
                <TR key={course.course_id}>
                  <TD>
                    <Link href={`/admin/courses/${course.course_id}`} className="font-medium text-ink hover:underline">
                      {course.course_title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[10px] text-muted">/{course.course_slug}</p>
                  </TD>
                  <TD className="font-mono">
                    {course.completed_lessons}/{course.total_lessons}
                  </TD>
                  <TD className="font-mono">{course.best_score === null ? "—" : `${course.best_score}%`}</TD>
                  <TD>
                    {course.certificate_number ? (
                      <span className="font-mono text-[11px] text-ink">{course.certificate_number}</span>
                    ) : (
                      <span className="text-muted">Belum ada</span>
                    )}
                    {course.revoked_at ? <StatusBadge status="revoked" /> : null}
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Percobaan quiz</h2>
        {attempts.length === 0 ? (
          <p className="text-[0.8125rem] text-muted">Belum ada percobaan quiz.</p>
        ) : (
          <DataTable caption="Percobaan quiz pengguna">
            <THead>
              <TR>
                <TH>Kursus</TH>
                <TH>Skor</TH>
                <TH>Benar</TH>
                <TH>Status</TH>
                <TH>Waktu</TH>
              </TR>
            </THead>
            <TBody>
              {attempts.map((attempt) => (
                <TR key={attempt.id}>
                  <TD>{attempt.course_title}</TD>
                  <TD className="font-mono">{attempt.score}%</TD>
                  <TD className="font-mono">
                    {attempt.correct_count}/{attempt.question_count}
                  </TD>
                  <TD className={attempt.passed ? "text-ok" : "text-danger"}>
                    {attempt.passed ? "Lulus" : "Belum lulus"}
                  </TD>
                  <TD className="whitespace-nowrap text-[11px] text-muted">{formatDateTime(attempt.created_at)}</TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">Sertifikat</h2>
        {certificates.length === 0 ? (
          <p className="text-[0.8125rem] text-muted">Belum ada sertifikat yang diterbitkan untuk akun ini.</p>
        ) : (
          <DataTable caption="Sertifikat pengguna">
            <THead>
              <TR>
                <TH>Nomor</TH>
                <TH>Kursus</TH>
                <TH>Nilai</TH>
                <TH>Terbit</TH>
                <TH>Status</TH>
                <TH>Aksi</TH>
              </TR>
            </THead>
            <TBody>
              {certificates.map((certificate) => (
                <TR key={certificate.id}>
                  <TD className="font-mono text-[11px] text-ink">{certificate.certificate_number}</TD>
                  <TD>{certificate.course_title_snapshot}</TD>
                  <TD className="font-mono">{certificate.final_score}%</TD>
                  <TD className="whitespace-nowrap text-[11px] text-muted">{formatDateTime(certificate.issued_at)}</TD>
                  <TD>
                    <StatusBadge status={certificate.revoked_at ? "revoked" : "valid"} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/certificates/${certificate.id}`} className="text-accent-text hover:underline">
                        Detail
                      </Link>
                      <Link href={`/verify/${certificate.verification_code}`} className="text-muted hover:underline" target="_blank" rel="noreferrer">
                        Verifikasi
                      </Link>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Status akses akun</h2>
        <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-muted">
          Menonaktifkan akun menghentikan akses ke dashboard, lesson, quiz, dan AI pada
          permintaan berikutnya. Riwayat belajar dan sertifikat tidak dihapus. Peran akun
          tidak bisa diubah dari panel ini; gunakan prosedur bootstrap SQL di README.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {user.suspended_at ? (
            <QuickAction
              action={reactivateUserAction}
              fields={{ userId: user.id }}
              label="Aktifkan kembali"
              variant="secondary"
              confirm="Aktifkan kembali akses akun ini?"
            />
          ) : isSelf ? (
            <p className="text-[11px] text-muted">Kamu tidak bisa menonaktifkan akun sendiri.</p>
          ) : (
            <ConfirmAction
              action={suspendUserAction}
              fields={{ userId: user.id }}
              title={`Nonaktifkan "${user.full_name || user.email}"?`}
              description="Akses aplikasi ditutup. Riwayat belajar tetap tersimpan dan bisa dibuka lagi kapan pun."
              triggerLabel="Nonaktifkan akun"
              confirmLabel="Nonaktifkan"
              reasonLabel="Alasan penonaktifan (tersimpan di log audit)"
              reasonRequired
            />
          )}
        </div>
      </section>
    </div>
  );
}

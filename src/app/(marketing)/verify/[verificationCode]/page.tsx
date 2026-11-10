import type { Metadata } from "next";
import Link from "next/link";
import { Award, CircleAlert, CircleCheck, CircleX, SearchX, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { verifyCertificateByCode } from "@/lib/data/certificates";
import { formatDate, formatDateTime, formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ verificationCode: string }> };

export const metadata: Metadata = {
  title: "Verifikasi sertifikat",
  description:
    "Periksa keaslian sertifikat LearnCode menggunakan kode verifikasi yang tercetak pada sertifikat.",
  robots: { index: false, follow: false },
};

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { verificationCode } = await params;
  const certificate = await verifyCertificateByCode(verificationCode);

  return (
    <div className="container-lc py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Verifikasi publik</p>
        <h1 className="display-section mt-2">Verifikasi sertifikat</h1>
        <p className="lead mt-3 text-base">
          Halaman ini memeriksa catatan penerbitan sertifikat di database LearnCode. Tidak perlu
          masuk ke akun untuk memverifikasi.
        </p>

        <div className="mt-8 rounded-[8px] border border-line bg-surface">
          {certificate ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
                <span
                  className={
                    certificate.revokedAt
                      ? "flex size-9 items-center justify-center rounded-full bg-danger-soft"
                      : "flex size-9 items-center justify-center rounded-full bg-ok-soft"
                  }
                  aria-hidden="true"
                >
                  {certificate.revokedAt ? (
                    <CircleX className="size-4 text-danger" />
                  ) : (
                    <CircleCheck className="size-4 text-ok" />
                  )}
                </span>
                <div>
                  <h2 className="text-sm font-medium text-ink">
                    {certificate.revokedAt ? "Sertifikat tidak berlaku" : "Sertifikat terverifikasi"}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    {certificate.revokedAt
                      ? "Catatan penerbitan ditemukan, tetapi sertifikat ini sudah dicabut oleh administrator."
                      : "Data di bawah berasal dari catatan penerbitan, bukan dari input pengguna."}
                  </p>
                </div>
              </div>

              {certificate.revokedAt ? (
                <div className="border-b border-line bg-danger-soft/50 px-5 py-3 text-xs leading-relaxed text-ink-soft sm:px-6">
                  <p>
                    Dicabut pada{" "}
                    <span className="font-mono">{formatDateTime(certificate.revokedAt)}</span>.
                  </p>
                  {certificate.revocationReason ? (
                    <p className="mt-1">Alasan: {certificate.revocationReason}</p>
                  ) : null}
                </div>
              ) : null}

              <dl className="divide-y divide-line px-5 text-sm sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-xs text-muted">Penerima</dt>
                  <dd className="font-serif text-lg text-ink">{certificate.recipientName}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-xs text-muted">Kursus</dt>
                  <dd className="max-w-[75%] text-right text-ink-soft">{certificate.courseTitle}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-xs text-muted">Nilai akhir</dt>
                  <dd className="font-mono text-ink-soft">
                    {formatScore(certificate.finalScore)}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-xs text-muted">Tanggal terbit</dt>
                  <dd className="font-mono text-ink-soft">{formatDate(certificate.issuedAt)}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <dt className="text-xs text-muted">Nomor sertifikat</dt>
                  <dd className="font-mono text-ink-soft">{certificate.certificateNumber}</dd>
                </div>
              </dl>

              <div className="border-t border-line px-5 py-4 sm:px-6">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                  {certificate.revokedAt ? (
                    <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden="true" />
                  )}
                  <span>
                    {certificate.revokedAt
                      ? "Halaman ini tetap menampilkan riwayat penerbitan agar status sertifikat bisa diaudit. Sertifikat yang dicabut tidak boleh dipakai sebagai bukti kelulusan."
                      : "Sertifikat ini diterbitkan otomatis setelah seluruh lesson kursus selesai dan quiz lulus. LearnCode adalah platform belajar independen; sertifikat bukan kredit akademik atau lisensi profesi."}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 sm:px-6">
                <span
                  className="flex size-9 items-center justify-center rounded-full bg-highlight-soft"
                  aria-hidden="true"
                >
                  <SearchX className="size-4 text-highlight" />
                </span>
                <div>
                  <h2 className="text-sm font-medium text-ink">Kode tidak ditemukan</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Periksa kembali kode verifikasi pada sertifikat.
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-5 py-5 text-sm leading-relaxed text-ink-soft sm:px-6">
                <p className="flex items-start gap-2">
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0 text-highlight"
                    aria-hidden="true"
                  />
                  <span>
                    Tidak ada catatan sertifikat yang cocok dengan kode{" "}
                    <code className="break-all rounded-[3px] bg-surface-2 px-1 py-0.5 font-mono text-[11px]">
                      {verificationCode}
                    </code>
                    . Kode yang salah ketik akan menghasilkan pesan yang sama, jadi halaman ini
                    tidak bisa dipakai untuk menebak kode yang valid.
                  </span>
                </p>
                <p className="text-xs text-muted">
                  Jika kamu penerima sertifikat, buka halaman sertifikat dari dashboard untuk
                  menyalin ulang tautan verifikasi.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/courses">
              <Award aria-hidden="true" />
              Lihat kursus
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

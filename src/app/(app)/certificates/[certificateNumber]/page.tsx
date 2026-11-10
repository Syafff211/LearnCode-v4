import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Download, ShieldCheck } from "lucide-react";

import { CertificateCard } from "@/components/certificates/certificate-card";
import { CopyButton } from "@/components/learning/copy-button";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { requireProfile } from "@/lib/auth";
import { getOwnedCertificate } from "@/lib/data/certificates";
import { getAppUrl } from "@/lib/env";
import { formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ certificateNumber: string }> };

const numberPattern = /^LC-[0-9]{4}-[A-Z0-9]{8}$/;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { certificateNumber } = await params;
  return {
    title: `Sertifikat ${certificateNumber}`,
    robots: { index: false, follow: false },
  };
}

async function resolveBaseUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return getAppUrl();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export default async function CertificateDetailPage({ params }: PageProps) {
  const { certificateNumber } = await params;
  if (!numberPattern.test(certificateNumber)) notFound();

  const { user } = await requireProfile(`/certificates/${certificateNumber}`);
  const certificate = await getOwnedCertificate(user.id, certificateNumber);
  if (!certificate) notFound();

  const baseUrl = await resolveBaseUrl();
  const verificationUrl = `${baseUrl}${certificate.verificationPath}`;

  return (
    <div className="container-lc py-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/certificates"
          className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Semua sertifikat
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {certificate.revoked_at ? (
            <Button size="sm" variant="secondary" disabled title="Unduhan dinonaktifkan karena sertifikat dicabut">
              <Download aria-hidden="true" />
              PDF dinonaktifkan
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <a href={`/api/certificates/${certificate.certificate_number}/pdf`}>
                <Download aria-hidden="true" />
                Unduh PDF
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link href={certificate.verificationPath} target="_blank" rel="noreferrer">
              Halaman verifikasi
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CertificateCard
            recipientName={certificate.recipient_name}
            courseTitle={certificate.course_title_snapshot}
            certificateNumber={certificate.certificate_number}
            verificationCode={certificate.verification_code}
            finalScore={certificate.final_score}
            issuedAt={certificate.issued_at}
            revokedAt={certificate.revoked_at ?? null}
          />

          {certificate.revoked_at ? (
            <Callout tone="warning" title="Sertifikat ini sudah dicabut" className="mt-4">
              <p>
                Sertifikat dicabut pada{" "}
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                  timeZone: "Asia/Jakarta",
                }).format(new Date(certificate.revoked_at))}
                .{certificate.revocation_reason ? ` Alasan: ${certificate.revocation_reason}` : ""}{" "}
                Riwayat penerbitan tetap tersimpan, tetapi sertifikat tidak berlaku dan PDF
                tidak bisa diunduh. Hubungi admin bila menurutmu ini keliru.
              </p>
            </Callout>
          ) : null}

          <Callout tone="info" title="Sertifikat PDF" className="mt-4">
            <p>
              Unduhan PDF berformat A4 landscape dan menyertakan kode QR yang mengarah ke halaman
              verifikasi publik. PDF dibuat ulang di server dari catatan sertifikat, bukan dari
              halaman ini.
            </p>
          </Callout>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <section className="rounded-[8px] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
              <ShieldCheck className="size-4 text-ok" aria-hidden="true" />
              Verifikasi publik
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Siapa pun yang memiliki tautan ini dapat memeriksa keaslian sertifikat tanpa masuk ke
              akun. Halaman verifikasi hanya menampilkan nama, judul kursus, nilai, dan tanggal
              terbit.
            </p>
            <p className="mt-3 break-all rounded-[4px] border border-line bg-surface-2 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-ink-soft">
              {verificationUrl}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CopyButton value={verificationUrl} label="Salin tautan verifikasi" />
              <Button asChild size="sm" variant="ghost">
                <Link href={certificate.verificationPath} target="_blank" rel="noreferrer">
                  Buka
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>

          <section className="rounded-[8px] border border-line bg-surface p-5">
            <h2 className="text-sm font-medium text-ink">Detail</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Penerima</dt>
                <dd className="max-w-[60%] truncate text-right text-ink-soft">
                  {certificate.recipient_name}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Kursus</dt>
                <dd className="max-w-[60%] truncate text-right text-ink-soft">
                  {certificate.course_title_snapshot}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Nilai akhir</dt>
                <dd className="font-mono text-ink-soft">{formatScore(certificate.final_score)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Kode verifikasi</dt>
                <dd className="font-mono text-ink-soft">{certificate.verification_code}</dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
              Nama dan judul kursus disimpan sebagai snapshot saat penerbitan. Mengubah nama profil
              tidak mengubah sertifikat yang sudah terbit.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

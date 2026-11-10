import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Download, ExternalLink, FileBadge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { getUserCertificates } from "@/lib/data/certificates";
import { formatDate, formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sertifikat",
  description: "Sertifikat kursus yang sudah diterbitkan untuk akunmu.",
};

export default async function CertificatesPage() {
  const { user } = await requireProfile("/dashboard/certificates");
  const certificates = await getUserCertificates(user.id);

  return (
    <div className="container-lc py-8 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Pencapaian</p>
          <h1 className="display-section mt-2">Sertifikat</h1>
          <p className="lead mt-3 text-base">
            Sertifikat diterbitkan otomatis oleh server saat semua lesson selesai dan nilai quiz
            memenuhi passing score. Setiap sertifikat punya kode verifikasi publik.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/dashboard">
            Kembali ke dashboard
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </header>

      {certificates.length === 0 ? (
        <div className="mt-8 rounded-[8px] border border-line bg-surface p-8 text-center sm:p-12">
          <span
            className="mx-auto flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface-2"
            aria-hidden="true"
          >
            <FileBadge className="size-5 text-muted" />
          </span>
          <h2 className="display-title mt-4">Belum ada sertifikat</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Selesaikan seluruh lesson sebuah kursus, lalu lulus quiz dengan nilai minimal yang
            ditentukan. Sertifikat akan muncul di sini tanpa perlu tombol klaim.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/courses">Lihat kursus</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Lanjutkan belajar</Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {certificates.map((certificate) => (
            <li
              key={certificate.id}
              className="flex flex-col rounded-[8px] border border-line bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex size-9 items-center justify-center rounded-[5px] border border-accent/20 bg-accent-soft"
                  aria-hidden="true"
                >
                  <Award className="size-4 text-accent-text" />
                </span>
                <span className="rounded-[3px] bg-ok-soft px-1.5 py-0.5 font-mono text-[10px] text-ok">
                  terbit
                </span>
              </div>

              <h2 className="mt-4 font-serif text-xl leading-snug text-ink">
                {certificate.course_title_snapshot}
              </h2>

              <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">No. sertifikat</dt>
                  <dd className="font-mono text-ink-soft">{certificate.certificate_number}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Nilai akhir</dt>
                  <dd className="font-mono text-ink-soft">{formatScore(certificate.final_score)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Terbit</dt>
                  <dd className="font-mono text-ink-soft">{formatDate(certificate.issued_at)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Button asChild size="sm">
                  <Link href={`/certificates/${certificate.certificate_number}`}>
                    Lihat
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <a href={`/api/certificates/${certificate.certificate_number}/pdf`}>
                    <Download aria-hidden="true" />
                    PDF
                  </a>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href={certificate.verificationPath} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" />
                    Verifikasi
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 max-w-2xl text-[11px] leading-relaxed text-muted">
        LearnCode adalah platform belajar independen. Sertifikat mencatat penyelesaian kursus di
        platform ini dan bukan kredit akademik atau sertifikasi profesi dari badan resmi mana pun.
      </p>
    </div>
  );
}

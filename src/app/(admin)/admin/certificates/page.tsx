import type { Metadata } from "next";
import Link from "next/link";

import { FilterBar } from "@/components/admin/filter-bar";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { requireAdminPage } from "@/lib/admin/auth";
import { listCertificateRows } from "@/lib/admin/queries";
import { ADMIN_PAGE_SIZE, adminSearchSchema } from "@/lib/validation/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sertifikat",
  robots: { index: false, follow: false },
};

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = adminSearchSchema.parse({
    q: typeof raw.q === "string" ? raw.q : "",
    status: typeof raw.status === "string" ? raw.status : "all",
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const { db } = await requireAdminPage("/admin/certificates");
  const { rows, total } = await listCertificateRows(db, {
    search: parsed.q,
    status: parsed.status,
    page: parsed.page,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sertifikat"
        description="Sertifikat hanya diterbitkan server setelah seluruh syarat kursus terpenuhi. Pencabutan menyimpan waktu, pelaku, dan alasan; riwayat tidak dihapus."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Sertifikat" }]}
      />

      <FilterBar
        action="/admin/certificates"
        query="certificates"
        searchValue={parsed.q}
        placeholder="Cari nomor, penerima, email, atau kursus…"
        resetHref="/admin/certificates"
        selects={[
          {
            name: "status",
            label: "Status",
            value: parsed.status,
            options: [
              { value: "all", label: "Semua status" },
              { value: "valid", label: "Berlaku" },
              { value: "revoked", label: "Dicabut" },
            ],
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={parsed.q || parsed.status !== "all" ? "Tidak ada sertifikat yang cocok" : "Belum ada sertifikat"}
          description={
            parsed.q || parsed.status !== "all"
              ? "Ubah pencarian atau filter status."
              : "Sertifikat muncul otomatis setelah peserta lulus semua syarat kursus. Tidak ada tombol penerbitan manual."
          }
        />
      ) : (
        <DataTable caption="Daftar sertifikat">
          <THead>
            <TR>
              <TH>Nomor</TH>
              <TH>Penerima</TH>
              <TH>Kursus</TH>
              <TH>Nilai</TH>
              <TH>Terbit</TH>
              <TH>Status</TH>
              <TH>Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((certificate) => (
              <TR key={certificate.id}>
                <TD className="font-mono text-[11px] text-ink">{certificate.certificate_number}</TD>
                <TD>
                  <p className="text-ink">{certificate.recipient_name}</p>
                  <p className="text-[10px] text-muted">{certificate.recipient_email || "—"}</p>
                </TD>
                <TD className="max-w-[16rem] truncate">{certificate.course_title}</TD>
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
                    <Link
                      href={`/verify/${certificate.verification_code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted hover:underline"
                    >
                      Verifikasi
                    </Link>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/certificates"
        params={{ q: parsed.q, status: parsed.status }}
        page={parsed.page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

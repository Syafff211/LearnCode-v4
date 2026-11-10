import type { Metadata } from "next";

import { FilterBar } from "@/components/admin/filter-bar";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAuditRows } from "@/lib/admin/queries";
import { ADMIN_PAGE_SIZE } from "@/lib/validation/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Log audit",
  robots: { index: false, follow: false },
};

const actionOptions = [
  "all",
  "course.created",
  "course.updated",
  "course.status_changed",
  "course.deleted",
  "lesson.created",
  "lesson.updated",
  "lesson.status_changed",
  "lesson.reordered",
  "lesson.deleted",
  "quiz.created",
  "quiz.updated",
  "question.created",
  "question.updated",
  "question.deleted",
  "question.reordered",
  "user.suspended",
  "user.reactivated",
  "certificate.revoked",
  "ai_settings.updated",
  "platform_settings.updated",
];

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const search = typeof raw.q === "string" ? raw.q.slice(0, 80) : "";
  const action = typeof raw.action === "string" && actionOptions.includes(raw.action) ? raw.action : "all";
  const page = Math.max(1, Number(typeof raw.page === "string" ? raw.page : "1") || 1);

  const { db } = await requireAdminPage("/admin/audit-logs");
  const { rows, total } = await listAuditRows(db, { search, action, page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Log audit"
        description="Catatan tindakan administratif yang ditulis server. Baris tidak bisa diubah atau dihapus lewat aplikasi; tidak ada password, token, atau kunci API di dalamnya."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Log audit" }]}
      />

      <FilterBar
        action="/admin/audit-logs"
        query="audit"
        searchValue={search}
        placeholder="Cari aktor, aksi, target, atau alasan…"
        resetHref="/admin/audit-logs"
        selects={[
          {
            name: "action",
            label: "Aksi",
            value: action,
            options: actionOptions.map((value) => ({
              value,
              label: value === "all" ? "Semua aksi" : value,
            })),
          },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada entri audit"
          description="Entri muncul saat admin membuat atau mengubah kursus, lesson, quiz, pengguna, sertifikat, atau pengaturan."
        />
      ) : (
        <DataTable caption="Log audit admin">
          <THead>
            <TR>
              <TH>Waktu</TH>
              <TH>Aktor</TH>
              <TH>Aksi</TH>
              <TH>Target</TH>
              <TH>Alasan</TH>
              <TH>Metadata</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((entry) => (
              <TR key={entry.id} className="align-top">
                <TD className="whitespace-nowrap text-[11px] text-muted">{formatDateTime(entry.created_at)}</TD>
                <TD className="text-[11px]">{entry.actor_email || "—"}</TD>
                <TD>
                  <span className="font-mono text-[11px] text-ink">{entry.action}</span>
                </TD>
                <TD className="text-[11px]">
                  {entry.target_type}
                  {entry.target_id ? (
                    <span className="ml-1 font-mono text-[10px] text-muted">{entry.target_id.slice(0, 8)}…</span>
                  ) : null}
                </TD>
                <TD className="max-w-[14rem] text-[11px]">{entry.reason || <span className="text-muted">—</span>}</TD>
                <TD className="max-w-[18rem]">
                  {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                    <details>
                      <summary className="cursor-pointer text-[11px] text-accent-text">Lihat</summary>
                      <pre className="mt-1 max-h-40 overflow-auto rounded-[4px] bg-surface-2 p-2 font-mono text-[10px] leading-relaxed text-ink-soft">
                        {JSON.stringify(entry.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-[11px] text-muted">—</span>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/audit-logs"
        params={{ q: search, action }}
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

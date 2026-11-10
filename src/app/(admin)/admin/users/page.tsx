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
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin/auth";
import { listUserRows } from "@/lib/admin/queries";
import { ADMIN_PAGE_SIZE, adminSearchSchema } from "@/lib/validation/admin";
import { formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengguna",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = adminSearchSchema.parse({
    q: typeof raw.q === "string" ? raw.q : "",
    status: "all",
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const { db } = await requireAdminPage("/admin/users");
  const { rows, total } = await listUserRows(db, { search: parsed.q, page: parsed.page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengguna"
        description="Pencarian berdasarkan nama atau email. Data sensitif seperti password, token sesi, dan kunci API tidak pernah dibaca atau ditampilkan di panel ini."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Pengguna" }]}
      />

      <FilterBar
        action="/admin/users"
        query="users"
        searchValue={parsed.q}
        placeholder="Cari nama atau email…"
        resetHref="/admin/users"
      />

      {rows.length === 0 ? (
        <EmptyState
          title={parsed.q ? "Pengguna tidak ditemukan" : "Belum ada pengguna"}
          description={
            parsed.q
              ? "Coba kata kunci lain. Pencarian mencocokkan nama lengkap dan email akun."
              : "Akun yang mendaftar lewat halaman register akan muncul di sini."
          }
        />
      ) : (
        <DataTable caption="Daftar pengguna">
          <THead>
            <TR>
              <TH>Pengguna</TH>
              <TH>Terdaftar</TH>
              <TH>Kursus</TH>
              <TH>Lesson selesai</TH>
              <TH>Quiz</TH>
              <TH>Sertifikat</TH>
              <TH>AI</TH>
              <TH>Status</TH>
              <TH>Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((user) => (
              <TR key={user.id}>
                <TD>
                  <Link href={`/admin/users/${user.id}`} className="font-medium text-ink hover:underline">
                    {user.full_name || "Tanpa nama"}
                  </Link>
                  <p className="mt-0.5 text-[10px] text-muted">{user.email || "email tidak tersedia"}</p>
                  {user.role === "admin" ? <p className="mt-0.5 text-[10px] text-accent-text">Admin</p> : null}
                </TD>
                <TD className="whitespace-nowrap text-[11px] text-muted">{formatShortDate(user.created_at)}</TD>
                <TD className="font-mono">{user.courses_started}</TD>
                <TD className="font-mono">{user.lessons_completed}</TD>
                <TD className="font-mono">{user.quiz_attempts}</TD>
                <TD className="font-mono">{user.certificates}</TD>
                <TD className="font-mono">{user.ai_messages}</TD>
                <TD>
                  <StatusBadge status={user.suspended_at ? "suspended" : "active"} />
                </TD>
                <TD>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/users/${user.id}`}>Detail</Link>
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/users"
        params={{ q: parsed.q }}
        page={parsed.page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  FileText,
  GraduationCap,
  PlusCircle,
  Sparkles,
  Users,
} from "lucide-react";

import {
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin/auth";
import { getDashboardStats } from "@/lib/admin/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ringkasan admin",
  robots: { index: false, follow: false },
};

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-[8px] border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted">{label}</p>
        <Icon className="size-3.5 text-muted" aria-hidden="true" />
      </div>
      <p className="mt-2 font-mono text-[1.6rem] font-medium leading-none text-ink">{value}</p>
      {hint ? <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const { db } = await requireAdminPage("/admin/dashboard");
  const stats = await getDashboardStats(db, 30);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ringkasan"
        description="Angka di bawah dibaca langsung dari database Supabase. Tidak ada statistik contoh atau angka yang diratakan."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Ringkasan" }]}
        actions={
          <>
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/courses/new">
                <PlusCircle aria-hidden="true" />
                Kursus baru
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/certificates">Tinjau sertifikat</Link>
            </Button>
          </>
        }
      />

      <section aria-label="Statistik platform" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Pengguna terdaftar"
          value={stats.users}
          hint={`${stats.admins} admin aktif · ${stats.usersSuspended} akun nonaktif`}
          icon={Users}
        />
        <Stat
          label="Kursus terbit"
          value={stats.coursesPublished}
          hint={`${stats.coursesDraft} draft · ${stats.coursesArchived} arsip`}
          icon={BookOpen}
        />
        <Stat
          label="Lesson"
          value={stats.lessonsTotal}
          hint={`${stats.lessonsPublished} terbit`}
          icon={FileText}
        />
        <Stat
          label="Peserta aktif"
          value={stats.participants}
          hint="Pernah menyelesaikan lesson atau mengerjakan quiz"
          icon={GraduationCap}
        />
        <Stat
          label="Sertifikat terbit"
          value={stats.certificates}
          hint={`${stats.completions} penyelesaian kursus · ${stats.certificatesRevoked} dicabut`}
          icon={Award}
        />
        <Stat
          label={`AI messages (${stats.periodDays} hari)`}
          value={stats.aiMessages}
          hint={`Dipakai ${stats.aiUsers} pengguna`}
          icon={Sparkles}
        />
        <Stat
          label="Quiz tersedia"
          value={stats.quizzesTotal}
          hint="Satu quiz akhir per kursus"
          icon={FileText}
        />
        <Stat
          label="Penyelesaian kursus"
          value={stats.completions}
          hint="Dihitung dari sertifikat yang diterbitkan server"
          icon={Award}
        />
      </section>

      <section className="space-y-3" aria-labelledby="aktivitas-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="aktivitas-heading" className="font-display text-lg font-semibold text-ink">
              Aktivitas admin terakhir
            </h2>
            <p className="text-xs text-muted">
              Ditulis otomatis oleh server ke <span className="font-mono">admin_audit_logs</span>.
            </p>
          </div>
          <Link href="/admin/audit-logs" className="text-xs text-accent-text hover:underline">
            Buka log audit lengkap
          </Link>
        </div>

        {stats.recentActivity.length === 0 ? (
          <EmptyState
            title="Belum ada aktivitas admin"
            description="Setelah kamu menyimpan kursus, lesson, atau mengubah pengaturan, entri audit akan muncul di sini."
          />
        ) : (
          <DataTable caption="Aktivitas admin terakhir">
            <THead>
              <TR>
                <TH>Waktu</TH>
                <TH>Aksi</TH>
                <TH>Target</TH>
                <TH>Oleh</TH>
              </TR>
            </THead>
            <TBody>
              {stats.recentActivity.map((entry) => (
                <TR key={entry.id}>
                  <TD className="whitespace-nowrap font-mono text-[11px] text-muted">
                    {formatDateTime(entry.created_at)}
                  </TD>
                  <TD>
                    <span className="font-mono text-[11px] text-ink">{entry.action}</span>
                  </TD>
                  <TD>
                    <span className="text-muted">{entry.target_type}</span>
                    {entry.target_id ? (
                      <span className="ml-1 font-mono text-[10px] text-muted" title={entry.target_id}>
                        {entry.target_id.slice(0, 8)}…
                      </span>
                    ) : null}
                  </TD>
                  <TD className="text-muted">{entry.actor_email || "—"}</TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
      </section>

      <section className="rounded-[8px] border border-line bg-surface p-4 text-[0.8125rem] leading-relaxed text-muted">
        <span className="mr-1 inline-flex">
          <StatusBadge status={stats.admins <= 1 ? "suspended" : "active"} />
        </span>
        {stats.admins <= 1
          ? "Hanya ada satu akun admin aktif. Tambahkan admin kedua lewat prosedur bootstrap SQL di README supaya tidak ada satu titik kegagalan."
          : `${stats.admins} akun admin aktif. Peran admin hanya bisa diubah lewat SQL oleh pemilik project, bukan dari panel ini.`}
      </section>
    </div>
  );
}

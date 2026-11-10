import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Megaphone, PlusCircle, Star } from "lucide-react";

import { EmptyState, FlashNotice, PageHeader, StatusBadge } from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { Button } from "@/components/ui/button";
import { togglePromotionalPopupAction } from "@/lib/actions/admin-promotional-popups";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminPromotionalPopups } from "@/lib/admin/promotional-popups";
import { getPromotionStatus, type PromotionFrequency } from "@/lib/promotional-popup";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Popup promosi",
  robots: { index: false, follow: false },
};

const frequencyLabels: Record<PromotionFrequency, string> = {
  every_reload: "Setiap reload",
  once_per_session: "Sekali per sesi",
  once_per_day: "Sekali per hari",
  once_per_user: "Sekali per akun",
  every_visit: "Setiap kunjungan",
};

export default async function AdminPromotionalPopupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { db } = await requireAdminPage("/admin/popups");
  const result = await listAdminPromotionalPopups(db);
  const popups = result.rows;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Popup promosi"
        description="Kelola kampanye dari konfigurasi Supabase. Hanya popup aktif yang sesuai jadwal, audience, dan target halaman yang dapat tampil."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Publikasi" }, { label: "Popup" }]}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/popups/new"><PlusCircle aria-hidden="true" /> Popup baru</Link>
          </Button>
        }
      />

      {query.created === "1" ? <FlashNotice>Popup tersimpan. Periksa pratinjau dan jadwal sebelum mengaktifkannya.</FlashNotice> : null}
      {query.deleted === "1" ? <FlashNotice>Popup dan konfigurasi terkait telah dihapus.</FlashNotice> : null}
      {query.primaryWarning === "1" ? <FlashNotice tone="warning">Popup tersimpan, tetapi belum menjadi popup utama. Buka popup lalu pilih status popup utama lagi.</FlashNotice> : null}

      {result.error ? (
        <FlashNotice tone="error">{result.error}</FlashNotice>
      ) : popups.length === 0 ? (
        <EmptyState
          title="Belum ada popup"
          description="Buat popup baru untuk mengatur konten, target halaman, frekuensi, dan jadwal. Popup tidak akan tampil sampai diaktifkan."
          action={<Button asChild size="sm"><Link href="/admin/popups/new">Buat popup</Link></Button>}
        />
      ) : (
        <div className="space-y-3">
          {popups.map((popup) => {
            const status = getPromotionStatus(popup);
            return (
              <article key={popup.id} className="rounded-[8px] border border-line bg-surface p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {popup.imageUrl ? (
                    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-[6px] border border-line bg-surface-2 sm:w-44">
                      <Image src={popup.imageUrl} alt={popup.imageAlt ?? ""} fill sizes="176px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] w-full shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface-2 text-muted sm:w-44" aria-hidden="true">
                      <Megaphone className="size-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-semibold text-ink">
                        <Link href={`/admin/popups/${popup.id}`} className="hover:underline">{popup.title}</Link>
                      </h2>
                      <StatusBadge status={status} />
                      {popup.isPrimary ? <span className="inline-flex items-center gap-1 rounded-[4px] bg-accent-soft px-2 py-1 text-[10px] font-medium text-accent-text"><Star className="size-3" aria-hidden="true" /> Utama</span> : null}
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{popup.internalName} · {frequencyLabels[popup.frequency]} · prioritas {popup.priority}</p>
                    {popup.description ? <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-ink-soft">{popup.description}</p> : null}
                    <p className="mt-2 text-[11px] text-muted">
                      Mulai {formatDateTime(popup.startsAt)}{popup.endsAt ? ` · berakhir ${formatDateTime(popup.endsAt)}` : " · tanpa tanggal akhir"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Target: {popup.displayConfig.pageTargets.map((target) => target.replaceAll("_", " ")).join(", ")}
                      {popup.displayConfig.customPaths.length ? ` · ${popup.displayConfig.customPaths.join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/admin/popups/${popup.id}`}><ExternalLink aria-hidden="true" /> Kelola</Link>
                    </Button>
                    <QuickAction
                      action={togglePromotionalPopupAction}
                      fields={{ popupId: popup.id, isActive: popup.isActive ? "false" : "true" }}
                      label={popup.isActive ? "Nonaktifkan" : "Aktifkan"}
                      variant={popup.isActive ? "ghost" : "secondary"}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="rounded-[8px] border border-line bg-surface-2/50 p-4 text-[11px] leading-relaxed text-muted">
        <p className="font-medium text-ink-soft">Pemilihan popup</p>
        <p className="mt-1">Pada satu kunjungan, sistem memilih popup cocok dengan prioritas tertinggi. Jika prioritas sama, popup utama mendapat urutan lebih dulu. Popup yang tidak cocok dengan audience atau halaman dilewati.</p>
      </div>
    </div>
  );
}

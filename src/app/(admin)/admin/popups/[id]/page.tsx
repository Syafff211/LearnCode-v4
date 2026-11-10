import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { FlashNotice, PageHeader, StatusBadge } from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { PromotionalPopupForm } from "@/components/admin/promotional-popup-form";
import { Button } from "@/components/ui/button";
import {
  deletePromotionalPopupAction,
  togglePromotionalPopupAction,
  updatePromotionalPopupAction,
} from "@/lib/actions/admin-promotional-popups";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAdminPromotionalPopup } from "@/lib/admin/promotional-popups";
import { getPromotionStatus } from "@/lib/promotional-popup";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola popup",
  robots: { index: false, follow: false },
};

export default async function PromotionalPopupEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { db } = await requireAdminPage(`/admin/popups/${id}`);
  const popup = await getAdminPromotionalPopup(db, id);
  if (!popup) notFound();
  const status = getPromotionStatus(popup);

  return (
    <div className="space-y-5">
      <PageHeader
        title={popup.title}
        description={`${popup.internalName} · prioritas ${popup.priority}`}
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Popup promosi", href: "/admin/popups" },
          { label: popup.internalName },
        ]}
        actions={
          <>
            <StatusBadge status={status} />
            {popup.isPrimary ? <StatusBadge status="primary" /> : null}
            <Button asChild size="sm" variant="ghost"><Link href="/admin/popups">Kembali</Link></Button>
          </>
        }
      />

      {query.created === "1" ? <FlashNotice>Popup dibuat. Tinjau pratinjau, lalu aktifkan setelah yakin konten dan jadwal benar.</FlashNotice> : null}
      {query.primaryWarning === "1" ? <FlashNotice tone="warning">Popup tersimpan, tetapi gagal ditetapkan sebagai utama. Coba simpan lagi status popup utama.</FlashNotice> : null}

      <section className="flex flex-wrap items-center gap-2 rounded-[8px] border border-line bg-surface p-3" aria-label="Aksi cepat popup">
        <span className="text-[0.8125rem] text-muted">Status cepat:</span>
        <QuickAction
          action={togglePromotionalPopupAction}
          fields={{ popupId: popup.id, isActive: popup.isActive ? "false" : "true" }}
          label={popup.isActive ? "Nonaktifkan popup" : "Aktifkan popup"}
          variant={popup.isActive ? "ghost" : "secondary"}
        />
        <span className="ml-auto text-[11px] text-muted">
          {popup.endsAt ? `Jadwal: ${new Date(popup.startsAt).toLocaleString("id-ID", { timeZone: "UTC" })}–${new Date(popup.endsAt).toLocaleString("id-ID", { timeZone: "UTC" })} UTC` : `Mulai ${new Date(popup.startsAt).toLocaleString("id-ID", { timeZone: "UTC" })} UTC`}
        </span>
      </section>

      <PromotionalPopupForm action={updatePromotionalPopupAction} popup={popup} />

      <section className="rounded-[8px] border border-danger/30 bg-danger-soft/40 p-4 sm:p-5">
        <h2 className="font-display text-base font-semibold text-ink">Zona berbahaya</h2>
        <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-ink-soft">
          Penghapusan permanen menghapus konfigurasi dan banner popup terkait. Aksi ini tercatat pada log audit.
        </p>
        <div className="mt-3">
          <ConfirmAction
            action={deletePromotionalPopupAction}
            fields={{ popupId: popup.id }}
            title={`Hapus popup “${popup.title}”?`}
            description="Penghapusan permanen. Pengunjung tidak lagi melihat popup ini setelah konfigurasi dihapus."
            triggerLabel="Hapus popup"
            confirmLabel="Hapus permanen"
            requireText={popup.internalName}
            textLabel={`Ketik nama internal “${popup.internalName}” untuk mengonfirmasi`}
          />
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";

import { PromotionalPopupForm } from "@/components/admin/promotional-popup-form";
import { PageHeader } from "@/components/admin/primitives";
import { createPromotionalPopupAction } from "@/lib/actions/admin-promotional-popups";
import { requireAdminPage } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Popup baru",
  robots: { index: false, follow: false },
};

export default async function NewPromotionalPopupPage() {
  await requireAdminPage("/admin/popups/new");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Popup baru"
        description="Atur konten, styling, frekuensi, audience, halaman, dan jadwal kampanye. Popup baru dinonaktifkan secara default."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Popup promosi", href: "/admin/popups" },
          { label: "Baru" },
        ]}
      />
      <PromotionalPopupForm action={createPromotionalPopupAction} />
    </div>
  );
}

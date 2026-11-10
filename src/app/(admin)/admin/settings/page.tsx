import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/primitives";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { updatePlatformSettingsAction } from "@/lib/actions/admin-governance";
import { requireAdminPage } from "@/lib/admin/auth";
import { getPlatformSettingsRow } from "@/lib/admin/queries";
import { getPlatformSettings } from "@/lib/platform";
import { hasServiceRole } from "@/lib/env";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan platform",
  robots: { index: false, follow: false },
};

export default async function AdminPlatformSettingsPage() {
  const { db } = await requireAdminPage("/admin/settings");
  const [row, resolved] = await Promise.all([getPlatformSettingsRow(db), getPlatformSettings()]);
  const serviceRole = hasServiceRole();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Platform"
        description="Identitas, tampilan sertifikat, kontak, dan status pemeliharaan. Semua nilai divalidasi di server sebelum disimpan."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Platform" }]}
      />

      <section className="rounded-[8px] border border-line bg-surface p-4 text-[0.8125rem] leading-relaxed text-muted">
        Sumber nilai saat ini:{" "}
        <span className="font-mono text-ink">{resolved.source === "database" ? "database" : "default aplikasi"}</span>.
        {row?.updated_at ? <> Terakhir diubah {formatDateTime(row.updated_at)}.</> : null}{" "}
        {serviceRole ? null : (
          <span className="text-danger"> Service role belum tersedia, pengaturan tidak bisa ditulis.</span>
        )}{" "}
        Konfigurasi keamanan seperti kunci API dan kredensial database tidak bisa diubah dari
        halaman ini.
      </section>

      <PlatformSettingsForm
        action={updatePlatformSettingsAction}
        initial={{
          platformName: row?.platform_name ?? resolved.platformName,
          shortDescription: row?.short_description ?? resolved.shortDescription,
          logoUrl: row?.logo_url ?? "",
          faviconUrl: row?.favicon_url ?? "",
          defaultLanguage: row?.default_language ?? resolved.defaultLanguage,
          certificateSignature: row?.certificate_signature ?? resolved.certificateSignature,
          defaultPassingScore: row?.default_passing_score ?? resolved.defaultPassingScore,
          contactEmail: row?.contact_email ?? "",
          contactUrl: row?.contact_url ?? "",
          maintenanceMode: row?.maintenance_mode ?? false,
          maintenanceMessage: row?.maintenance_message ?? "",
        }}
      />
    </div>
  );
}

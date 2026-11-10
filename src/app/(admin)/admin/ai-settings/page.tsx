import type { Metadata } from "next";
import { KeyRound, ShieldCheck } from "lucide-react";

import { AiSettingsForm } from "@/components/admin/ai-settings-form";
import { FlashNotice, PageHeader } from "@/components/admin/primitives";
import { GROQ_ALLOWED_MODELS, GROQ_MODEL_LABELS } from "@/lib/ai/features";
import { getAiSettings } from "@/lib/ai/settings";
import { updateAiSettingsAction } from "@/lib/actions/admin-governance";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAiSettingsRow, getDashboardStats } from "@/lib/admin/queries";
import { isAIConfigured, hasServiceRole } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan AI",
  robots: { index: false, follow: false },
};

export default async function AdminAiSettingsPage() {
  const { db, user } = await requireAdminPage("/admin/ai-settings");
  const [row, stats, runtime] = await Promise.all([
    getAiSettingsRow(db),
    getDashboardStats(db, 30),
    getAiSettings(),
  ]);

  const configured = isAIConfigured();
  const serviceRole = hasServiceRole();

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Tutor"
        description="Provider tetap Groq. Panel ini hanya mengubah perilaku yang aman; kunci API tidak pernah disimpan di database maupun ditampilkan kembali."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "AI Tutor" }]}
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[8px] border border-line bg-surface p-4">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-muted">
            <KeyRound className="size-3" aria-hidden="true" />
            GROQ_API_KEY
          </p>
          <p className={`mt-1.5 text-sm font-medium ${configured ? "text-ok" : "text-danger"}`}>
            {configured ? "Terdeteksi di environment server" : "Belum dikonfigurasi"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Nilai kunci tidak pernah dikirim ke browser, tidak bisa dibaca dari panel ini,
            dan tidak disimpan di database. Atur lewat environment Vercel.
          </p>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4">
          <p className="text-[11px] uppercase tracking-[0.06em] text-muted">Service role</p>
          <p className={`mt-1.5 text-sm font-medium ${serviceRole ? "text-ok" : "text-danger"}`}>
            {serviceRole ? "Tersedia untuk server" : "Belum tersedia"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Dipakai untuk membaca pengaturan dan menulis log audit. Tidak pernah diekspos ke
            komponen klien.
          </p>
        </div>
        <div className="rounded-[8px] border border-line bg-surface p-4">
          <p className="text-[11px] uppercase tracking-[0.06em] text-muted">Model aktif</p>
          <p className="mt-1.5 font-mono text-sm text-ink">{runtime.model}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            Sumber: {runtime.source === "database" ? "pengaturan database" : "default environment"}.
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 rounded-[8px] border border-line bg-surface p-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Pesan AI (30 hari)</p>
          <p className="mt-1 font-mono text-lg text-ink">{stats.aiMessages}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Pengguna AI (30 hari)</p>
          <p className="mt-1 font-mono text-lg text-ink">{stats.aiUsers}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted">Kuota per pengguna</p>
          <p className="mt-1 font-mono text-lg text-ink">{runtime.dailyMessageLimit}/hari</p>
        </div>
      </section>

      {!configured ? (
        <FlashNotice tone="warning">
          Tanpa <span className="font-mono">GROQ_API_KEY</span>, AI Tutor menampilkan status
          belum aktif dan endpoint AI mengembalikan 503. Pengaturan di bawah tetap tersimpan
          dan langsung dipakai begitu kunci ditambahkan ke environment server.
        </FlashNotice>
      ) : null}

      <section className="rounded-[8px] border border-line bg-surface p-4 text-[11px] leading-relaxed text-muted">
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden="true" />
          <span>
            Model yang bisa dipilih:{" "}
            {GROQ_ALLOWED_MODELS.map((model) => `${GROQ_MODEL_LABELS[model].split(" — ")[0]} (${model})`).join(", ")}.
            Nilai di luar daftar ditolak server. Tidak ada input untuk menulis kunci API ke
            database, dan error provider tidak pernah membocorkan isi kunci.
          </span>
        </p>
      </section>

      <AiSettingsForm
        action={updateAiSettingsAction}
        initial={{
          enabled: row?.enabled ?? true,
          dailyMessageLimit: row?.daily_message_limit ?? runtime.dailyMessageLimit,
          maxInputChars: row?.max_input_chars ?? runtime.maxInputChars,
          maxOutputTokens: row?.max_output_tokens ?? runtime.maxOutputTokens,
          model: row?.model ?? runtime.model,
          features: row?.features ?? runtime.features,
          learningInstructions: row?.learning_instructions ?? "",
        }}
      />

      <p className="text-[11px] text-muted">
        Terakhir diubah: {row?.updated_at ? new Date(row.updated_at).toLocaleString("id-ID") : "belum pernah"} · oleh{" "}
        {user.email ?? "admin"}
      </p>
    </div>
  );
}

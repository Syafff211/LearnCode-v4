import type { Metadata } from "next";
import { LogOut } from "lucide-react";

import { PasswordForm } from "@/components/settings/password-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { requireProfile } from "@/lib/auth";
import { formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengaturan akun",
  description: "Kelola nama, bahasa AI Tutor, dan password akun LearnCode.",
};

export default async function SettingsPage() {
  const { user, profile } = await requireProfile("/settings");

  return (
    <div className="container-lc py-8 lg:py-12">
      <header className="max-w-2xl">
        <p className="eyebrow">Akun</p>
        <h1 className="display-section mt-2">Pengaturan</h1>
        <p className="lead mt-3 text-base">
          Data profil disimpan di tabel <code className="font-mono text-sm">profiles</code> dengan
          Row Level Security: hanya kamu yang bisa membaca dan mengubahnya.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section
            aria-labelledby="profil-heading"
            className="rounded-[8px] border border-line bg-surface"
          >
            <div className="border-b border-line px-5 py-4">
              <h2 id="profil-heading" className="text-sm font-medium text-ink">
                Profil
              </h2>
              <p className="mt-1 text-xs text-muted">
                Nama yang tersimpan dipakai untuk sertifikat yang diterbitkan setelah perubahan.
              </p>
            </div>
            <div className="px-5 py-5">
              <ProfileForm
                fullName={profile.full_name}
                preferredLanguage={profile.preferred_language}
                theme={profile.theme}
                email={user.email ?? ""}
              />
            </div>
          </section>

          <section
            aria-labelledby="password-heading"
            className="rounded-[8px] border border-line bg-surface"
          >
            <div className="border-b border-line px-5 py-4">
              <h2 id="password-heading" className="text-sm font-medium text-ink">
                Password
              </h2>
              <p className="mt-1 text-xs text-muted">
                Password lama diverifikasi ulang di server sebelum password baru disimpan.
              </p>
            </div>
            <div className="px-5 py-5">
              <PasswordForm />
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <section aria-labelledby="akun-heading" className="rounded-[8px] border border-line bg-surface">
            <div className="border-b border-line px-5 py-4">
              <h2 id="akun-heading" className="text-sm font-medium text-ink">
                Detail akun
              </h2>
            </div>
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface-2 font-mono text-xs text-ink-soft"
                  aria-hidden="true"
                >
                  {initials(profile.full_name || user.email || "LC")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {profile.full_name || "Pelajar LearnCode"}
                  </p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
              </div>

              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Bergabung</dt>
                  <dd className="font-mono text-ink-soft">{formatDate(profile.created_at)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Peran</dt>
                  <dd className="font-mono text-ink-soft">
                    {profile.role === "admin" ? "Admin" : "Pengguna"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Bahasa</dt>
                  <dd className="font-mono text-ink-soft">
                    {profile.preferred_language === "en" ? "English" : "Indonesia"}
                  </dd>
                </div>
              </dl>

              <form action={signOutAction} className="mt-5 border-t border-line pt-4">
                <Button type="submit" variant="secondary" size="sm" className="w-full">
                  <LogOut aria-hidden="true" />
                  Keluar dari akun
                </Button>
              </form>
            </div>
          </section>

          <section className="rounded-[8px] border border-line bg-surface p-5">
            <h2 className="text-sm font-medium text-ink">Catatan privasi</h2>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
              <li>Sertifikat menyimpan nama dan judul kursus sebagai snapshot saat diterbitkan.</li>
              <li>Percakapan AI Tutor hanya bisa dibaca oleh akunmu sendiri.</li>
              <li>
                Menghapus akun belum tersedia di antarmuka; hubungi pemilik instance untuk
                penghapusan data.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

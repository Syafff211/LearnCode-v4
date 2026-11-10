import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { getOptionalUser } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Akun dinonaktifkan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountSuspendedPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?error=suspended");

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended_at, suspended_reason")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.suspended_at) redirect("/dashboard");

  const platform = await getPlatformSettings();

  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo src={platform.logoUrl} />
        </div>
        <section className="rounded-[10px] border border-line bg-surface p-6 shadow-[0_1px_0_rgba(0,0,0,0.03)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-danger">
            Akses ditangguhkan
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
            Akun kamu dinonaktifkan
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Administrator menonaktifkan akses ke akun <strong>{user.email}</strong> pada{" "}
            {formatDate(profile.suspended_at)}. Kelas, progres belajar, dan sertifikatmu tetap
            tersimpan dan tidak dihapus.
          </p>
          {profile.suspended_reason ? (
            <p className="mt-3 rounded-[6px] border border-line bg-surface-2 px-3 py-2 text-[0.8125rem] text-ink-soft">
              Catatan dari administrator: {profile.suspended_reason}
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Ingin mengajukan peninjauan?{" "}
            {platform.contactEmail ? (
              <>
                Hubungi{" "}
                <a className="underline underline-offset-2" href={`mailto:${platform.contactEmail}`}>
                  {platform.contactEmail}
                </a>{" "}
                atau{" "}
              </>
            ) : null}
            hubungi administrator {platform.platformName} melalui kanal resmi yang biasa kamu
            gunakan.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <form action={signOutAction}>
              <Button type="submit" size="sm">
                Keluar dari akun ini
              </Button>
            </form>
            <Button asChild size="sm" variant="ghost">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </div>
        </section>
        <p className="mt-4 text-center text-[11px] text-muted">
          Jika kamu yakin ini keliru, sertakan alamat email akunmu saat menghubungi admin.
        </p>
      </div>
    </main>
  );
}

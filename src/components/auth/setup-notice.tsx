import { Callout } from "@/components/ui/callout";

export function SetupNotice() {
  return (
    <Callout tone="warning" title="Supabase belum dikonfigurasi" className="mb-5">
      Autentikasi membutuhkan project Supabase. Isi{" "}
      <code className="font-mono text-[0.8em]">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
      <code className="font-mono text-[0.8em]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, dan{" "}
      <code className="font-mono text-[0.8em]">SUPABASE_SERVICE_ROLE_KEY</code> lalu
      jalankan migration. Panduan lengkap ada di README.
    </Callout>
  );
}

"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-[8px] border border-line bg-surface p-6">
      <h1 className="font-display text-xl font-semibold text-ink">Halaman admin gagal dimuat</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
        Data tidak bisa diambil dari Supabase saat ini. Tidak ada perubahan yang
        disimpan. Coba muat ulang; bila terus berulang, periksa koneksi database
        dan environment server.
      </p>
      <Button className="mt-4" variant="secondary" onClick={reset}>
        Coba lagi
      </Button>
    </div>
  );
}

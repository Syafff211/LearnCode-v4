import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Code2, Info, ShieldCheck, Terminal } from "lucide-react";

import { PlaygroundWorkspace } from "@/app/(app)/playground/playground-workspace";
import { Callout } from "@/components/ui/callout";
import { requireProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Playground",
  description: "Tulis dan jalankan HTML, CSS, dan JavaScript langsung di browser.",
};

export default async function PlaygroundPage() {
  await requireProfile("/playground");

  return (
    <div className="container-lc py-8 sm:py-10">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Playground</p>
          <h1 className="display-section mt-2">Ruang eksperimen</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Tulis HTML, CSS, dan JavaScript, lalu jalankan langsung di browser.
            Preview dijalankan di dalam iframe tersandbox, bukan di halaman aplikasi.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-ok" />
            Editor siap
          </span>
          <span aria-hidden="true">·</span>
          <span>Autosave tidak aktif</span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <PlaygroundWorkspace />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Tekan <span className="font-medium text-ink-soft">Run</span> untuk
            mengeksekusi ulang kode. Preview tidak diperbarui otomatis saat kamu
            mengetik. Proyek yang disimpan melalui tombol Simpan hanya tersimpan
            di browser ini (localStorage), bukan di akun atau database.
          </p>
        </div>

        <aside className="space-y-5">
          <Callout tone="info" title="Cakupan playground">
            Playground hanya menjalankan HTML, CSS, dan JavaScript. Tidak ada
            eksekusi Node.js, Python, atau kode backend pada server.
          </Callout>

          <div className="rounded-[8px] border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-ink">
              <ShieldCheck className="size-3.5 text-accent-text" aria-hidden="true" />
              Isolasi kode
            </p>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
              <li>iframe memakai sandbox=&quot;allow-scripts&quot; tanpa akses same-origin.</li>
              <li>Kode tidak dapat membaca cookie atau data aplikasi LearnCode.</li>
              <li>Kode tidak dieksekusi di server dan tidak disimpan ke database.</li>
            </ul>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-ink">
              <Terminal className="size-3.5 text-accent-text" aria-hidden="true" />
              Membaca console
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Gunakan <code className="font-mono">console.log()</code> untuk
              memeriksa nilai. Error JavaScript dari preview muncul di panel
              console beserta nomor baris bila tersedia.
            </p>
          </div>

          <div className="rounded-[8px] border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-ink">
              <Info className="size-3.5 text-accent-text" aria-hidden="true" />
              Butuh konteks?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Buka lesson terkait untuk membaca penjelasan konsep yang kamu
              praktikkan di sini.
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link
                  href="/learn/html-formulir-aksesibilitas"
                  className="flex items-center justify-between gap-2 text-accent-text underline-offset-2 hover:underline"
                >
                  HTML: formulir aksesibel
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/css-flexbox-grid"
                  className="flex items-center justify-between gap-2 text-accent-text underline-offset-2 hover:underline"
                >
                  CSS: Flexbox dan Grid
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/js-dom-event"
                  className="flex items-center justify-between gap-2 text-accent-text underline-offset-2 hover:underline"
                >
                  JS: DOM dan event
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </div>

          <div className="rounded-[8px] border border-dashed border-line-strong p-4">
            <p className="flex items-center gap-2 text-xs font-medium text-ink-soft">
              <Code2 className="size-3.5 text-accent-text" aria-hidden="true" />
              Latihan terbimbing
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Setiap lesson memiliki latihan dengan starter code. Kode itu bisa
              kamu salin ke playground untuk eksperimen lebih bebas.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

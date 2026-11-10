import { Sparkles } from "lucide-react";

export function AiChatMock() {
  return (
    <div aria-hidden="true" className="panel overflow-hidden bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <Sparkles className="size-3.5 text-accent-text" />
          AI Tutor
        </p>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          Debug mode · ID
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="ml-auto max-w-[85%] rounded-[6px] border border-line bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-ink-soft">
          Kenapa kartu saya melebar keluar layar padahal lebarnya sudah 100%?
        </div>
        <div className="max-w-[92%] rounded-[6px] border border-line bg-canvas px-3 py-2.5">
          <p className="text-[11.5px] leading-relaxed text-ink-soft">
            Kemungkinan besar <span className="font-mono text-[10.5px]">width: 100%</span>{" "}
            ditambah padding masih memakai <span className="font-mono text-[10.5px]">content-box</span>.
            Lebar totalnya jadi 100% + 48px.
          </p>
          <div className="mt-2 rounded-[4px] bg-code-bg p-2 font-mono text-[10px] leading-relaxed text-ink-soft">
            <p className="text-muted">{"/* cek dulu, jangan langsung ubah */"}</p>
            <p>.kartu {"{"}</p>
            <p className="pl-3">box-sizing: ?;</p>
            <p>{"}"}</p>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-soft">
            Coba ubah <span className="font-mono text-[10.5px]">box-sizing</span> menjadi{" "}
            <span className="font-mono text-[10.5px]">border-box</span>, lalu lihat apakah
            scroll horizontal hilang. Menurutmu mengapa itu terjadi?
          </p>
          <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            <span className="size-1 rounded-full bg-accent" /> hint, bukan jawaban lengkap
          </div>
        </div>
      </div>

      <div className="border-t border-line px-4 py-2.5">
        <p className="text-[10px] leading-relaxed text-muted">
          AI bisa keliru. Selalu jalankan kode di playground untuk memastikan.
        </p>
      </div>
    </div>
  );
}

import { Play, RotateCcw, Terminal } from "lucide-react";

export function PlaygroundMock() {
  return (
    <div aria-hidden="true" className="panel overflow-hidden bg-surface shadow-[0_18px_50px_-34px_rgb(25_24_20/0.4)]">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-1">
          {["HTML", "CSS", "JS"].map((tab, index) => (
            <span
              key={tab}
              className={`rounded-[4px] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] ${
                index === 0 ? "bg-surface-2 text-ink" : "text-muted"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-[4px] border border-line px-2 py-1 text-[10px] text-muted">
            <RotateCcw className="size-3" />
            Reset
          </span>
          <span className="inline-flex items-center gap-1 rounded-[4px] bg-accent px-2 py-1 text-[10px] font-medium text-accent-ink">
            <Play className="size-3" />
            Run
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2">
        <div className="border-b border-line bg-code-bg py-3 font-mono text-[10.5px] leading-[1.9] sm:border-b-0 sm:border-r">
          {[
            '<div class="counter">',
            '  <p id="value">0</p>',
            '  <button id="add">Tambah</button>',
            "</div>",
            "<script>",
            "  let count = 0;",
            '  const value = document.querySelector("#value");',
            '  document.querySelector("#add").addEventListener("click", () => {',
            "    count += 1;",
            "    value.textContent = count;",
            "  });",
            "</script>",
          ].map((line, index) => (
            <div key={index} className="flex gap-3 px-3">
              <span className="w-4 shrink-0 select-none text-right text-muted/60">
                {index + 1}
              </span>
              <span className="whitespace-pre text-ink-soft">
                {line.split(/(\/\/|#value|#add|\d+)/g).map((part, partIndex) =>
                  part.startsWith("#") || /^\d+$/.test(part) ? (
                    <span key={partIndex} className="text-highlight">
                      {part}
                    </span>
                  ) : (
                    part
                  ),
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              Output
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px] text-ok">
              <span className="size-1.5 rounded-full bg-ok" />
              iframe sandbox
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-[11rem] rounded-[6px] border border-line bg-canvas p-4 text-center">
              <p className="font-mono text-[22px] font-medium tabular-nums text-ink">3</p>
              <p className="mt-1 text-[10px] text-muted">klik tercatat</p>
              <span className="mt-3 inline-flex rounded-[4px] border border-line-strong bg-surface px-2.5 py-1 text-[10px] text-ink-soft">
                Tambah
              </span>
            </div>
          </div>
          <div className="border-t border-line bg-surface-2 px-3 py-2">
            <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              <Terminal className="size-3" />
              Console
            </p>
            <p className="mt-1 font-mono text-[10px] text-ink-soft">
              <span className="text-muted">›</span> count updated: 3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

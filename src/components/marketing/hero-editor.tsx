import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * Non-interactive product preview for the landing page. It mirrors the real
 * learning workspace: lesson progress, a code sample, a rendered preview, and
 * a hint card from the AI Tutor.
 */
export function HeroEditor() {
  return (
    <figure className="relative">
      <div
        aria-hidden="true"
        className="panel overflow-hidden bg-surface shadow-[0_18px_50px_-32px_rgb(25_24_20/0.45)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
              <span className="size-1.5 rounded-full bg-accent" />
              Lesson 02
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-muted sm:inline">
              index.html
            </span>
          </div>
          <Badge variant="outline" className="border-line bg-surface-2">
            Draft
          </Badge>
        </div>

        <div className="px-4 pb-4 pt-3">
          <p className="font-display text-[1.05rem] leading-snug text-ink">
            Teks, tautan, dan gambar
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full w-1/2 rounded-full bg-accent" />
            </div>
            <span className="font-mono text-[10px] text-muted">2 / 4</span>
          </div>
        </div>

        <div className="grid border-t border-line sm:grid-cols-[1.12fr_1fr]">
          <div className="overflow-hidden bg-code-bg px-0 py-3 font-mono text-[10.5px] leading-[1.85] sm:text-[11px]">
            {[
              [
                { text: "<article", tone: "accent" },
                { text: ' class="card"', tone: "amber" },
                { text: ">", tone: "accent" },
              ],
              [
                { text: "  <p", tone: "accent" },
                { text: ' class="eyebrow"', tone: "amber" },
                { text: ">Lesson 02</p>", tone: "accent" },
              ],
              [
                { text: "  <h2>", tone: "accent" },
                { text: "Membaca itu latihan", tone: "ink" },
                { text: "</h2>", tone: "accent" },
              ],
              [
                { text: "  <p>", tone: "accent" },
                { text: "Ubah satu baris, lihat efeknya.", tone: "ink" },
              ],
              [{ text: "  </p>", tone: "accent" }],
              [
                { text: "  <a", tone: "accent" },
                { text: ' href="#latihan"', tone: "green" },
                { text: ">", tone: "accent" },
                { text: "Coba latihan", tone: "ink" },
                { text: "</a>", tone: "accent" },
              ],
              [{ text: "</article>", tone: "accent" }],
            ].map((line, lineIndex) => (
              <div key={lineIndex} className="flex gap-3 px-3.5">
                <span className="w-4 shrink-0 select-none text-right text-muted/60">
                  {lineIndex + 1}
                </span>
                <span className="whitespace-pre">
                  {line.map((token, tokenIndex) => (
                    <span
                      key={tokenIndex}
                      className={
                        token.tone === "accent"
                          ? "text-accent-text"
                          : token.tone === "amber"
                            ? "text-highlight"
                            : token.tone === "green"
                              ? "text-ink-soft"
                              : "text-ink"
                      }
                    >
                      {token.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
            <div className="mt-2 flex items-center gap-3 px-3.5 text-muted/60">
              <span className="w-4 shrink-0 text-right">8</span>
              <span className="h-3.5 w-[2px] animate-pulse bg-accent" />
            </div>
          </div>

          <div className="border-t border-line bg-surface p-4 sm:border-l sm:border-t-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
              Preview
            </p>
            <div className="mt-2.5 rounded-[5px] border border-line bg-canvas p-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent-text">
                Lesson 02
              </p>
              <p className="mt-2 font-display text-[1.25rem] leading-tight text-ink">
                Membaca itu latihan
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                Ubah satu baris, lihat efeknya.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-[4px] border border-line-strong bg-surface px-2 py-1 text-[10px] text-ink-soft">
                Coba latihan
              </span>
            </div>

            <div className="mt-3 rounded-[5px] border border-line bg-surface-2 p-3">
              <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                <Sparkles className="size-3 text-accent-text" />
                AI Tutor · Hint 1 dari 3
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
                Bandingkan elemen dengan <span className="font-mono">class=&quot;card&quot;</span>.
                Properti apa yang menentukan lebar totalnya?
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-surface px-4 py-2.5">
          <span className="inline-flex items-center gap-1 rounded-[4px] bg-accent px-2 py-1 text-[10px] font-medium text-accent-ink">
            <Check className="size-3" />
            Lesson ditandai selesai
          </span>
          <span className="font-mono text-[10px] text-muted">progress tersimpan</span>
        </div>
      </div>
      <figcaption className="mt-3 flex items-start justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.07em] text-muted">
        <span>Preview workspace lesson</span>
        <span className="hidden sm:inline">HTML · CSS · JavaScript</span>
      </figcaption>
    </figure>
  );
}

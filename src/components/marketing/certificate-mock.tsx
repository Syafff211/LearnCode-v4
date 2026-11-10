import { Badge } from "@/components/ui/badge";

/** Static preview of the real PDF certificate design. */
export function CertificateMock() {
  return (
    <div className="relative">
      <Badge variant="outline" className="absolute -top-2.5 left-4 z-10 bg-canvas">
        Pratinjau sertifikat
      </Badge>
      <div className="rounded-[6px] border border-line-strong bg-[#faf9f5] p-4 text-[#191814] shadow-[0_18px_50px_-34px_rgb(25_24_20/0.45)] sm:p-6">
        <div className="border border-[#1e4c3d]/60 p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="font-display text-[13px] font-semibold">LearnCode</span>
            <span className="font-mono text-[6.5px] uppercase tracking-[0.14em] text-[#6a675e]">
              Certificate of completion
            </span>
          </div>
          <div className="mt-5 sm:mt-7">
            <p className="font-mono text-[6.5px] uppercase tracking-[0.16em] text-[#1e4c3d]">
              Sertifikat penyelesaian kursus
            </p>
            <p className="mt-2 font-display text-[1.45rem] leading-tight tracking-[-0.02em] sm:text-[1.8rem]">
              Nama Penerima
            </p>
            <div className="mt-2 h-[2px] w-10 bg-[#1e4c3d]" />
            <p className="mt-3 text-[8.5px] text-[#6a675e]">
              telah berhasil menyelesaikan kursus
            </p>
            <p className="mt-1 font-display text-[15px] text-[#3f3d36]">HTML Fundamentals</p>
            <p className="mt-3 inline-flex bg-[#e8f0ea] px-2 py-1 font-mono text-[6.5px] uppercase tracking-[0.08em] text-[#1e4c3d]">
              Nilai akhir 92%
            </p>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#e3dfd4] pt-3">
            <div>
              <p className="font-mono text-[5.5px] uppercase tracking-[0.1em] text-[#6a675e]">
                Diterbitkan
              </p>
              <p className="text-[7.5px] text-[#3f3d36]">17 Oktober 2026</p>
              <p className="mt-1.5 font-mono text-[5.5px] uppercase tracking-[0.1em] text-[#6a675e]">
                Nomor
              </p>
              <p className="text-[7.5px] text-[#3f3d36]">LC-2026-7KQ2M9XA</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="grid size-12 grid-cols-5 gap-[1px] bg-white p-1 ring-1 ring-[#e3dfd4] sm:size-14">
                {Array.from({ length: 25 }, (_, index) => (
                  <span
                    key={index}
                    className={
                      [0, 1, 2, 4, 5, 8, 10, 12, 14, 16, 18, 20, 21, 22, 24].includes(index)
                        ? "bg-[#1e4c3d]"
                        : "bg-transparent"
                    }
                  />
                ))}
              </div>
              <p className="mt-1 font-mono text-[5px] uppercase tracking-[0.08em] text-[#6a675e]">
                Verifikasi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { formatDate, formatScore } from "@/lib/utils";

/**
 * Paper preview of a certificate. Purely presentational: the authoritative PDF
 * is generated on the server from the database record.
 */
export function CertificateCard({
  recipientName,
  courseTitle,
  certificateNumber,
  verificationCode,
  finalScore,
  issuedAt,
  revokedAt = null,
}: {
  recipientName: string;
  courseTitle: string;
  certificateNumber: string;
  verificationCode: string;
  finalScore: number;
  issuedAt: string;
  revokedAt?: string | null;
}) {
  return (
    <article
      aria-label={revokedAt ? "Pratinjau sertifikat (dicabut)" : "Pratinjau sertifikat"}
      className="relative rounded-[6px] border border-line bg-[#faf9f5] p-2 text-[#191814] shadow-[0_1px_2px_rgb(25_24_20_/_0.06)]"
    >
      {revokedAt ? (
        <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rotate-[-6deg] border-y border-[#a72a1f]/40 bg-[#faeeec]/90 py-2 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#a72a1f]">
            Sertifikat dicabut
          </p>
        </div>
      ) : null}
      <div className="relative aspect-[1.414/1] overflow-hidden rounded-[3px] border border-[#d9d3c4] px-[7%] py-[6.5%]">
        <div
          className="pointer-events-none absolute inset-[2.6%] rounded-[2px] border border-[#c9c2b0]"
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-4">
            <p className="font-serif text-[0.95rem] tracking-[0.02em]">LearnCode</p>
            <p className="text-right font-mono text-[8px] uppercase leading-relaxed tracking-[0.16em] text-[#6a675e]">
              Sertifikat penyelesaian
              <br />
              Learn by doing. Understand with AI.
            </p>
          </div>

          <div className="pt-[7%]">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#6a675e]">
              Diberikan kepada
            </p>
            <p className="mt-[2.5%] font-serif text-[clamp(1.35rem,4vw,2.6rem)] leading-[1.05] tracking-[-0.01em]">
              {recipientName}
            </p>
            <p className="mt-[4%] max-w-[85%] text-[clamp(0.65rem,1.4vw,0.8rem)] leading-relaxed text-[#3f3d36]">
              atas penyelesaian seluruh lesson dan kelulusan quiz pada kursus
            </p>
            <p className="mt-[1.5%] font-serif text-[clamp(0.95rem,2.6vw,1.5rem)] leading-snug text-[#1e4c3d]">
              {courseTitle}
            </p>
          </div>

          <div className="mt-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#d9d3c4] pt-[3.5%]">
              <dl className="flex flex-wrap gap-x-[7%] gap-y-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[#6a675e]">
                <div>
                  <dt>Nilai akhir</dt>
                  <dd className="mt-1 font-serif text-sm normal-case tracking-normal text-[#191814]">
                    {formatScore(finalScore)}
                  </dd>
                </div>
                <div>
                  <dt>Tanggal terbit</dt>
                  <dd className="mt-1 font-serif text-sm normal-case tracking-normal text-[#191814]">
                    {formatDate(issuedAt)}
                  </dd>
                </div>
                <div>
                  <dt>Nomor sertifikat</dt>
                  <dd className="mt-1 font-mono text-[9px] normal-case tracking-[0.04em] text-[#191814]">
                    {certificateNumber}
                  </dd>
                </div>
              </dl>
              <p className="font-mono text-[7px] uppercase leading-relaxed tracking-[0.12em] text-[#6a675e]">
                Verifikasi di
                <br />
                /verify/{verificationCode.slice(0, 8)}…
              </p>
            </div>
            <p className="mt-[2%] text-[7px] leading-relaxed text-[#6a675e]">
              Diterbitkan oleh LearnCode berdasarkan catatan penyelesaian kursus pada platform ini.
              Bukan kredit akademik atau sertifikasi profesi dari badan resmi.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

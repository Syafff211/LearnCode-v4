import { ApiError, requireApiSession } from "@/lib/api";
import { buildCertificatePdf } from "@/lib/certificate/pdf";
import { getOwnedCertificate } from "@/lib/data/certificates";
import { certificateLimiter } from "@/lib/rate-limit";
import { getPlatformSettings } from "@/lib/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const numberPattern = /^LC-[0-9]{4}-[A-Z0-9]{8}$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ certificateNumber: string }> },
) {
  try {
    const { user } = await requireApiSession();
    const { certificateNumber } = await context.params;

    if (!numberPattern.test(certificateNumber)) {
      return genericNotFound();
    }

    const limit = certificateLimiter.check(`certificate-pdf:${user.id}`);
    if (!limit.allowed) {
      throw new ApiError(429, "rate_limited", "Terlalu banyak permintaan unduhan. Coba lagi nanti.");
    }

    // RLS + explicit user filter: cannot download another learner's certificate.
    const certificate = await getOwnedCertificate(user.id, certificateNumber);
    if (!certificate) return genericNotFound();

    if (certificate.revoked_at) {
      return Response.json(
        {
          error: {
            code: "certificate_revoked",
            message: "Sertifikat ini sudah dicabut, jadi unduhan dinonaktifkan. Hubungi admin bila keliru.",
          },
        },
        { status: 410, headers: { "Cache-Control": "no-store" } },
      );
    }

    const platform = await getPlatformSettings();
    const pdf = await buildCertificatePdf({
      recipientName: certificate.recipient_name,
      courseTitle: certificate.course_title_snapshot,
      certificateNumber: certificate.certificate_number,
      verificationCode: certificate.verification_code,
      finalScore: certificate.final_score,
      issuedAt: certificate.issued_at,
      platformName: platform.platformName,
      signature: platform.certificateSignature,
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="LearnCode-${certificate.certificate_number}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return Response.json(
        { error: { code: "unauthenticated", message: error.message } },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[certificates] PDF generation failed", error);
    return Response.json(
      {
        error: {
          code: "pdf_failed",
          message: "PDF belum bisa dibuat saat ini. Coba lagi beberapa saat.",
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

function genericNotFound(): Response {
  return Response.json(
    {
      error: {
        code: "not_found",
        message: "Sertifikat tidak ditemukan pada akun ini.",
      },
    },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

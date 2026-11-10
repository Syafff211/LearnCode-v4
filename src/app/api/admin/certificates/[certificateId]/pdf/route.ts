import { getAdminAuthState } from "@/lib/admin/auth";
import { buildCertificatePdf } from "@/lib/certificate/pdf";
import { adminSensitiveLimiter } from "@/lib/rate-limit";
import { getPlatformSettings } from "@/lib/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idPattern = /^[0-9a-f-]{36}$/i;

/**
 * Administrative copy of a certificate PDF. Requires a database-verified admin
 * session; never exposes the service-role key or another user's session.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ certificateId: string }> },
) {
  const state = await getAdminAuthState();
  if (state.status !== "ok") {
    // Distinguish a missing session (401) from a signed-in non-admin (403) so
    // API clients can react correctly; never leak admin data either way.
    const unauthenticated = state.status === "unauthenticated";
    const unavailable = state.status === "unavailable";
    return Response.json(
      {
        error: {
          code: unauthenticated ? "unauthenticated" : unavailable ? "unavailable" : "forbidden",
          message: unauthenticated
            ? "Masuk sebagai admin untuk mengunduh sertifikat."
            : unavailable
              ? "Panel admin belum dikonfigurasi."
              : "Akses admin diperlukan.",
        },
      },
      {
        status: unauthenticated ? 401 : unavailable ? 503 : 403,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const limit = adminSensitiveLimiter.check(`certificate-pdf:${state.context.user.id}`);
  if (!limit.allowed) {
    return Response.json(
      { error: { code: "rate_limited", message: "Terlalu banyak unduhan. Coba lagi sebentar." } },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const { certificateId } = await context.params;
  if (!idPattern.test(certificateId)) {
    return Response.json({ error: { code: "not_found", message: "Sertifikat tidak ditemukan." } }, { status: 404 });
  }

  const { data: certificate } = await state.context.db
    .from("certificates")
    .select("recipient_name, course_title_snapshot, certificate_number, verification_code, final_score, issued_at")
    .eq("id", certificateId)
    .maybeSingle();

  if (!certificate) {
    return Response.json({ error: { code: "not_found", message: "Sertifikat tidak ditemukan." } }, { status: 404 });
  }

  try {
    const platform = await getPlatformSettings();
    const pdf = await buildCertificatePdf({
      recipientName: certificate.recipient_name as string,
      courseTitle: certificate.course_title_snapshot as string,
      certificateNumber: certificate.certificate_number as string,
      verificationCode: certificate.verification_code as string,
      finalScore: Number(certificate.final_score),
      issuedAt: certificate.issued_at as string,
      platformName: platform.platformName,
      signature: platform.certificateSignature,
    });

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${certificate.certificate_number as string}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[admin] certificate PDF failed", error instanceof Error ? error.message : error);
    return Response.json(
      { error: { code: "pdf_failed", message: "PDF belum bisa dibuat saat ini." } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

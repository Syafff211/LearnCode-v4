import { NextResponse } from "next/server";

import { verifyCertificateByCode } from "@/lib/data/certificates";
import { isValidVerificationCode } from "@/lib/services/certificate-identity";
import { SlidingWindowLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publicLimiter = new SlidingWindowLimiter(30, 60_000);

export async function GET(
  request: Request,
  context: { params: Promise<{ verificationCode: string }> },
) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!publicLimiter.check(`verify:${ip}`).allowed) {
    return NextResponse.json(
      { valid: false, error: { code: "rate_limited", message: "Terlalu banyak permintaan verifikasi." } },
      { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } },
    );
  }

  const { verificationCode } = await context.params;

  if (!isValidVerificationCode(verificationCode)) {
    return NextResponse.json(
      { valid: false, error: { code: "not_found", message: "Sertifikat tidak ditemukan." } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const certificate = await verifyCertificateByCode(verificationCode);
  if (!certificate) {
    return NextResponse.json(
      { valid: false, error: { code: "not_found", message: "Sertifikat tidak ditemukan." } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const revoked = certificate.revokedAt !== null;

  return NextResponse.json(
    {
      // A revoked certificate is a real record, but it is not valid.
      valid: !revoked,
      status: revoked ? "revoked" : "valid",
      certificate: {
        recipientName: certificate.recipientName,
        courseTitle: certificate.courseTitle,
        certificateNumber: certificate.certificateNumber,
        finalScore: certificate.finalScore,
        issuedAt: certificate.issuedAt,
        revokedAt: certificate.revokedAt,
        revocationReason: certificate.revocationReason,
      },
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

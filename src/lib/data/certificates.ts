import "server-only";

import { isValidVerificationCode } from "@/lib/services/certificate-identity";
import type { CertificateRecord } from "@/lib/services/certificates";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PublicCertificate = {
  recipientName: string;
  courseTitle: string;
  certificateNumber: string;
  finalScore: number;
  issuedAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
};

export type OwnedCertificate = CertificateRecord & {
  verificationPath: string;
};

export async function getUserCertificates(userId: string): Promise<OwnedCertificate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  if (error || !data) return [];

  return (data as CertificateRecord[]).map((row) => ({
    ...row,
    verificationPath: `/verify/${row.verification_code}`,
  }));
}

export async function getOwnedCertificate(
  userId: string,
  certificateNumber: string,
): Promise<OwnedCertificate | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("certificate_number", certificateNumber)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as CertificateRecord;
  return { ...row, verificationPath: `/verify/${row.verification_code}` };
}

/**
 * Public verification. Uses the service role to look up ONLY display fields,
 * and returns the same shape for "not found" so no internal details leak.
 */
export async function verifyCertificateByCode(
  verificationCode: string,
): Promise<PublicCertificate | null> {
  if (!isValidVerificationCode(verificationCode)) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("certificates")
      .select(
        "recipient_name, course_title_snapshot, certificate_number, final_score, issued_at, revoked_at, revocation_reason",
      )
      .eq("verification_code", verificationCode)
      .maybeSingle();

    if (error || !data) return null;

    return {
      recipientName: data.recipient_name as string,
      courseTitle: data.course_title_snapshot as string,
      certificateNumber: data.certificate_number as string,
      finalScore: Number(data.final_score),
      issuedAt: data.issued_at as string,
      revokedAt: (data.revoked_at as string | null) ?? null,
      revocationReason: (data.revocation_reason as string | null) ?? null,
    };
  } catch (error) {
    console.error(
      "[certificates] verification lookup failed",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

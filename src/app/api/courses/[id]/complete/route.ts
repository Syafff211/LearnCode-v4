import { z } from "zod";

import { ApiError, handleRouteError, jsonOk, requireApiSession } from "@/lib/api";
import {
  CertificateError,
  createSupabaseCertificationRepository,
  ensureCourseCertificate,
} from "@/lib/services/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.uuid();

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireApiSession();
    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      throw new ApiError(400, "invalid_id", "ID kursus tidak valid.");
    }

    try {
      const result = await ensureCourseCertificate(
        createSupabaseCertificationRepository(),
        { userId: user.id, courseId: parsedId.data },
      );

      return jsonOk({
        eligible: result.eligibility.eligible,
        created: result.created,
        requirements: result.eligibility.requirements,
        finalScore: result.eligibility.finalScore,
        certificate: result.certificate
          ? {
              certificateNumber: result.certificate.certificate_number,
              verificationPath: `/verify/${result.certificate.verification_code}`,
              recipientName: result.certificate.recipient_name,
              courseTitle: result.certificate.course_title_snapshot,
              finalScore: result.certificate.final_score,
              issuedAt: result.certificate.issued_at,
            }
          : null,
      });
    } catch (error) {
      if (error instanceof CertificateError) {
        if (error.code === "course_not_found") {
          throw new ApiError(404, "course_not_found", error.message);
        }
        if (error.code === "course_unpublished") {
          throw new ApiError(403, "course_unpublished", error.message);
        }
        throw new ApiError(503, "certificate_unavailable", error.message);
      }
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}

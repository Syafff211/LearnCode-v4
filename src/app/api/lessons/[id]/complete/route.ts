import { z } from "zod";

import { ApiError, handleRouteError, jsonOk, requireApiSession } from "@/lib/api";
import { certificateLimiter } from "@/lib/rate-limit";
import {
  CertificateError,
  createSupabaseCertificationRepository,
  ensureCourseCertificate,
} from "@/lib/services/certificates";
import { evaluateCourseCompletion } from "@/lib/services/completion";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
      throw new ApiError(400, "invalid_id", "ID lesson tidak valid.");
    }

    const limit = certificateLimiter.check(`lesson-complete:${user.id}`);
    if (!limit.allowed) {
      throw new ApiError(
        429,
        "rate_limited",
        "Terlalu banyak permintaan dalam waktu singkat. Coba lagi sebentar.",
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: lesson, error: lessonError } = await admin
      .from("lessons")
      .select("id, slug, title, course_id")
      .eq("id", parsedId.data)
      .maybeSingle();

    if (lessonError || !lesson) {
      throw new ApiError(404, "lesson_not_found", "Lesson tidak ditemukan.");
    }

    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, slug, title, status, passing_score")
      .eq("id", lesson.course_id as string)
      .maybeSingle();

    if (courseError || !course || course.status !== "published") {
      throw new ApiError(404, "course_not_found", "Kursus tidak ditemukan.");
    }

    // Explicit, idempotent completion. Opening a lesson never calls this route.
    const { error: insertError } = await admin
      .from("lesson_progress")
      .upsert(
        {
          user_id: user.id,
          course_id: course.id as string,
          lesson_id: lesson.id as string,
        },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );

    if (insertError) {
      console.error("[progress] failed to save completion", insertError.message);
      throw new ApiError(500, "progress_failed", "Progress belum bisa disimpan. Coba lagi.");
    }

    const [progressRes, lessonsRes, quizRes, attemptsRes] = await Promise.all([
      admin
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("course_id", course.id as string),
      admin.from("lessons").select("id").eq("course_id", course.id as string),
      admin
        .from("quizzes")
        .select("id")
        .eq("course_id", course.id as string)
        .maybeSingle(),
      admin
        .from("quiz_attempts")
        .select("score, passed")
        .eq("user_id", user.id)
        .eq("course_id", course.id as string),
    ]);

    const completedIds = (progressRes.data ?? []).map((row) => row.lesson_id as string);
    const totalLessons = (lessonsRes.data ?? []).length;
    const attempts = (attemptsRes.data ?? []).map((row) => ({
      score: Number(row.score),
      passed: Boolean(row.passed),
    }));

    const eligibility = evaluateCourseCompletion({
      totalLessons,
      completedLessonIds: completedIds,
      quizExists: Boolean(quizRes.data),
      attempts,
      passingScore: Number(course.passing_score),
    });

    let certificate: {
      certificateNumber: string;
      verificationPath: string;
      finalScore: number;
    } | null = null;

    if (eligibility.eligible) {
      try {
        const result = await ensureCourseCertificate(
          createSupabaseCertificationRepository(),
          { userId: user.id, courseId: course.id as string },
        );
        if (result.certificate) {
          certificate = {
            certificateNumber: result.certificate.certificate_number,
            verificationPath: `/verify/${result.certificate.verification_code}`,
            finalScore: result.certificate.final_score,
          };
        }
      } catch (error) {
        if (!(error instanceof CertificateError)) {
          console.error(
            "[progress] certificate issuance failed",
            error instanceof Error ? error.message : error,
          );
        }
      }
    }

    return jsonOk({
      lesson: {
        id: lesson.id as string,
        slug: lesson.slug as string,
        title: lesson.title as string,
      },
      course: {
        id: course.id as string,
        slug: course.slug as string,
        title: course.title as string,
      },
      progress: {
        completedLessons: eligibility.completedLessons,
        totalLessons: eligibility.totalLessons,
        percent:
          eligibility.totalLessons === 0
            ? 0
            : Math.round((eligibility.completedLessons / eligibility.totalLessons) * 100),
      },
      eligibility,
      certificate,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

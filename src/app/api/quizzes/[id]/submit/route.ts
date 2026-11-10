import { z } from "zod";

import { ApiError, handleRouteError, jsonOk, readJson, requireApiSession } from "@/lib/api";
import { getQuizWithAnswersById } from "@/lib/data/quiz";
import { authActionLimiter } from "@/lib/rate-limit";
import {
  CertificateError,
  createSupabaseCertificationRepository,
  ensureCourseCertificate,
} from "@/lib/services/certificates";
import { evaluateCourseCompletion, gradeQuiz } from "@/lib/services/completion";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paramsSchema = z.uuid();
const bodySchema = z
  .object({
    answers: z.record(z.uuid(), z.string().max(64)),
  })
  .strict()
  .refine((value) => Object.keys(value.answers).length <= 30, {
    message: "Terlalu banyak jawaban.",
    path: ["answers"],
  });

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireApiSession();
    const { id } = await context.params;
    const quizId = paramsSchema.safeParse(id);
    if (!quizId.success) {
      throw new ApiError(400, "invalid_id", "ID quiz tidak valid.");
    }

    const limit = authActionLimiter.check(`quiz-submit:${user.id}`);
    if (!limit.allowed) {
      throw new ApiError(
        429,
        "rate_limited",
        "Terlalu banyak pengiriman quiz. Tunggu sebentar lalu coba lagi.",
      );
    }

    const raw = await readJson(request);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", "Jawaban belum lengkap atau tidak valid.");
    }

    const quiz = await getQuizWithAnswersById(quizId.data);
    if (!quiz || quiz.questions.length === 0) {
      throw new ApiError(404, "quiz_not_found", "Quiz tidak ditemukan.");
    }

    const admin = createSupabaseAdminClient();
    const { data: course, error: courseError } = await admin
      .from("courses")
      .select("id, slug, title, status, passing_score, require_all_lessons")
      .eq("id", quiz.courseId)
      .maybeSingle();

    if (courseError || !course || course.status !== "published") {
      throw new ApiError(404, "course_not_found", "Kursus tidak ditemukan.");
    }

    // The client never sends a score. It is computed here from the stored keys.
    const grading = gradeQuiz(
      quiz.questions.map((question) => ({
        id: question.id,
        correctOptionId: question.correctOptionId,
        optionIds: question.options.map((option) => option.id),
        explanation: question.explanation,
        weight: question.weight,
      })),
      parsed.data.answers,
      Number(course.passing_score),
    );

    const { error: insertError } = await admin.from("quiz_attempts").insert({
      user_id: user.id,
      course_id: course.id as string,
      quiz_id: quiz.id,
      answers: parsed.data.answers,
      score: grading.score,
      passed: grading.passed,
      correct_count: grading.correctCount,
      question_count: grading.questionCount,
      passing_score: Number(course.passing_score),
      // Frozen rule set for this attempt. Later edits never rewrite history.
      scoring_snapshot: {
        passingScore: Number(course.passing_score),
        weights: Object.fromEntries(
          quiz.questions.map((question) => [question.id, question.weight ?? 1]),
        ),
      },
    });

    if (insertError) {
      console.error("[quiz] failed to save attempt", insertError.message);
      throw new ApiError(500, "attempt_failed", "Hasil quiz belum bisa disimpan. Coba lagi.");
    }

    const [progressRes, lessonsRes, attemptsRes] = await Promise.all([
      admin
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("course_id", course.id as string),
      admin
        .from("lessons")
        .select("id")
        .eq("course_id", course.id as string)
        .eq("status", "published")
        .eq("required", true),
      admin
        .from("quiz_attempts")
        .select("score, passed")
        .eq("user_id", user.id)
        .eq("course_id", course.id as string),
    ]);

    const attempts = (attemptsRes.data ?? []).map((row) => ({
      score: Number(row.score),
      passed: Boolean(row.passed),
    }));
    const bestScore =
      attempts.length === 0 ? null : Math.max(...attempts.map((attempt) => attempt.score));

    const lessonsRequired = course.require_all_lessons !== false;
    const eligibility = evaluateCourseCompletion({
      totalLessons: lessonsRequired ? (lessonsRes.data ?? []).length : 0,
      completedLessonIds: lessonsRequired
        ? (progressRes.data ?? []).map((row) => row.lesson_id as string)
        : [],
      quizExists: true,
      attempts,
      passingScore: Number(course.passing_score),
      lessonsRequired,
      quizRequired: quiz.required,
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
            "[quiz] certificate issuance failed",
            error instanceof Error ? error.message : error,
          );
        }
      }
    }

    return jsonOk({
      quizId: quiz.id,
      score: grading.score,
      passed: grading.passed,
      correctCount: grading.correctCount,
      questionCount: grading.questionCount,
      bestScore,
      attemptsCount: attempts.length,
      passingScore: Number(course.passing_score),
      results: grading.answers,
      eligibility,
      certificate,
      course: {
        id: course.id as string,
        slug: course.slug as string,
        title: course.title as string,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

import "server-only";

import { getAppUrl } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  evaluateCourseCompletion,
  type CompletionEvaluation,
  type QuizAttemptSummary,
} from "@/lib/services/completion";
import {
  generateCertificateNumber,
  generateVerificationCode,
} from "@/lib/services/certificate-identity";

export type CertificateRecord = {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  verification_code: string;
  recipient_name: string;
  course_title_snapshot: string;
  final_score: number;
  issued_at: string;
  created_at: string;
  revoked_at?: string | null;
  revocation_reason?: string | null;
};

export type CertificationCourse = {
  id: string;
  title: string;
  passingScore: number;
  status: string;
  requireAllLessons: boolean;
};

export type CertificationQuiz = {
  id: string;
  passingScore: number;
  required: boolean;
};

export interface CertificationRepository {
  getCourse(courseId: string): Promise<CertificationCourse | null>;
  getLessonIds(courseId: string): Promise<string[]>;
  getCompletedLessonIds(userId: string, courseId: string): Promise<string[]>;
  getQuiz(courseId: string): Promise<CertificationQuiz | null>;
  getAttempts(userId: string, quizId: string): Promise<QuizAttemptSummary[]>;
  getExistingCertificate(
    userId: string,
    courseId: string,
  ): Promise<CertificateRecord | null>;
  getRecipientName(userId: string): Promise<string>;
  insertCertificate(row: {
    user_id: string;
    course_id: string;
    certificate_number: string;
    verification_code: string;
    recipient_name: string;
    course_title_snapshot: string;
    final_score: number;
  }): Promise<{ certificate: CertificateRecord | null; duplicate: boolean }>;
}

export class CertificateError extends Error {
  readonly code: "course_not_found" | "course_unpublished" | "insert_failed";
  constructor(code: CertificateError["code"], message: string) {
    super(message);
    this.name = "CertificateError";
    this.code = code;
  }
}

export type EnsureCertificateResult = {
  eligibility: CompletionEvaluation;
  certificate: CertificateRecord | null;
  created: boolean;
  verificationUrl: string | null;
};

/**
 * Server-only, idempotent certificate issuance.
 *
 * 1. Loads progress + quiz attempts from the database (never from the client).
 * 2. Recomputes eligibility with the same rules used everywhere else.
 * 3. Returns an existing certificate if one has already been issued.
 * 4. Inserts with unique(user_id, course_id) and handles concurrent duplicates
 *    by re-reading the winner's row.
 */
export async function ensureCourseCertificate(
  repo: CertificationRepository,
  input: { userId: string; courseId: string },
): Promise<EnsureCertificateResult> {
  const course = await repo.getCourse(input.courseId);
  if (!course) {
    throw new CertificateError("course_not_found", "Kursus tidak ditemukan.");
  }
  if (course.status !== "published") {
    throw new CertificateError("course_unpublished", "Kursus ini belum dipublikasikan.");
  }

  const [lessonIds, completedIds, quiz, existing] = await Promise.all([
    repo.getLessonIds(input.courseId),
    repo.getCompletedLessonIds(input.userId, input.courseId),
    repo.getQuiz(input.courseId),
    repo.getExistingCertificate(input.userId, input.courseId),
  ]);

  const relevantCompleted = completedIds.filter((id) => lessonIds.includes(id));
  const attempts = quiz ? await repo.getAttempts(input.userId, quiz.id) : [];

  const eligibility = evaluateCourseCompletion({
    totalLessons: lessonIds.length,
    completedLessonIds: relevantCompleted,
    quizExists: Boolean(quiz),
    attempts,
    passingScore: course.passingScore,
    lessonsRequired: course.requireAllLessons,
    quizRequired: Boolean(quiz && quiz.required),
  });

  // An already-issued certificate stays valid even if content changes later.
  if (existing) {
    return {
      eligibility,
      certificate: existing,
      created: false,
      verificationUrl: `${getAppUrl()}/verify/${existing.verification_code}`,
    };
  }

  if (!eligibility.eligible) {
    return { eligibility, certificate: null, created: false, verificationUrl: null };
  }

  const recipientName = (await repo.getRecipientName(input.userId)).trim();
  const year = new Date().getUTCFullYear();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const inserted = await repo.insertCertificate({
      user_id: input.userId,
      course_id: input.courseId,
      certificate_number: generateCertificateNumber(year),
      verification_code: generateVerificationCode(),
      recipient_name: recipientName.length > 0 ? recipientName : "Pelajar LearnCode",
      course_title_snapshot: course.title,
      final_score: eligibility.finalScore ?? 0,
    });

    if (inserted.certificate) {
      return {
        eligibility,
        certificate: inserted.certificate,
        created: true,
        verificationUrl: `${getAppUrl()}/verify/${inserted.certificate.verification_code}`,
      };
    }

    if (inserted.duplicate) {
      const winner = await repo.getExistingCertificate(input.userId, input.courseId);
      if (winner) {
        return {
          eligibility,
          certificate: winner,
          created: false,
          verificationUrl: `${getAppUrl()}/verify/${winner.verification_code}`,
        };
      }
    }
  }

  throw new CertificateError(
    "insert_failed",
    "Sertifikat gagal diterbitkan. Coba lagi beberapa saat.",
  );
}

type CertificateRow = CertificateRecord;

/**
 * Supabase adapter. Every query uses the service-role client because all
 * writes are server-authorized and quiz attempts/progress are read-only for
 * users. User identity is always the verified session id passed by the caller.
 */
export function createSupabaseCertificationRepository(): CertificationRepository {
  const admin = createSupabaseAdminClient();

  return {
    async getCourse(courseId) {
      const { data, error } = await admin
        .from("courses")
        .select("id, title, passing_score, status, require_all_lessons")
        .eq("id", courseId)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id as string,
        title: data.title as string,
        passingScore: Number(data.passing_score),
        status: data.status as string,
        requireAllLessons: data.require_all_lessons !== false,
      };
    },

    async getLessonIds(courseId) {
      const { data, error } = await admin
        .from("lessons")
        .select("id")
        .eq("course_id", courseId)
        .eq("status", "published")
        .eq("required", true);
      if (error || !data) return [];
      return data.map((row) => row.id as string);
    },

    async getCompletedLessonIds(userId, courseId) {
      const { data, error } = await admin
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("course_id", courseId);
      if (error || !data) return [];
      return data.map((row) => row.lesson_id as string);
    },

    async getQuiz(courseId) {
      const { data, error } = await admin
        .from("quizzes")
        .select("id, passing_score, required")
        .eq("course_id", courseId)
        .maybeSingle();
      if (error || !data) return null;
      return {
        id: data.id as string,
        passingScore: Number(data.passing_score),
        required: data.required !== false,
      };
    },

    async getAttempts(userId, quizId) {
      const { data, error } = await admin
        .from("quiz_attempts")
        .select("score, passed")
        .eq("user_id", userId)
        .eq("quiz_id", quizId);
      if (error || !data) return [];
      return data.map((row) => ({
        score: Number(row.score),
        passed: Boolean(row.passed),
      }));
    },

    async getExistingCertificate(userId, courseId) {
      const { data, error } = await admin
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();
      if (error || !data) return null;
      return data as CertificateRow;
    },

    async getRecipientName(userId) {
      const { data, error } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      if (error || !data) return "";
      return (data.full_name as string) ?? "";
    },

    async insertCertificate(row) {
      const { data, error } = await admin
        .from("certificates")
        .insert(row)
        .select("*")
        .maybeSingle();

      if (error) {
        if (error.code === "23505") {
          // Either user+course or certificate_number/verification_code collided.
          const existing = await this.getExistingCertificate(row.user_id, row.course_id);
          return { certificate: existing, duplicate: true };
        }
        console.error("[certificates] insert failed", error.message);
        return { certificate: null, duplicate: false };
      }

      return { certificate: (data as CertificateRow | null) ?? null, duplicate: false };
    },
  };
}

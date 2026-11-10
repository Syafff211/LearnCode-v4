"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import {
  adminErrorState,
  checkAdminRateLimit,
  requiredString,
  zodFieldErrors,
  type AdminActionState,
} from "@/lib/actions/admin-shared";
import { parseQuestionForm, parseQuizForm } from "@/lib/validation/admin";

function revalidateQuizSurfaces(courseSlug?: string) {
  revalidatePath("/admin/quizzes");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/dashboard");
  if (courseSlug) {
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/courses/${courseSlug}/quiz`);
  }
}

export async function createQuizAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const parsed = parseQuizForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data quiz.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: course } = await context.db
      .from("courses")
      .select("id, slug, title")
      .eq("id", parsed.data.courseId)
      .maybeSingle();
    if (!course) return { status: "error", message: "Kursus tidak ditemukan." };

    const { data: existing } = await context.db
      .from("quizzes")
      .select("id")
      .eq("course_id", parsed.data.courseId)
      .maybeSingle();
    if (existing) {
      return {
        status: "error",
        message: "Kursus ini sudah punya quiz. Satu kursus hanya memiliki satu quiz akhir.",
      };
    }

    const { data, error } = await context.db
      .from("quizzes")
      .insert({
        course_id: parsed.data.courseId,
        title: parsed.data.title,
        description: parsed.data.description,
        passing_score: parsed.data.passingScore,
        required: parsed.data.required,
      })
      .select("id")
      .single();

    if (error || !data) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "quiz.created",
      targetType: "quiz",
      targetId: data.id as string,
      metadata: {
        title: parsed.data.title,
        course: course.title as string,
        passingScore: parsed.data.passingScore,
      },
    });

    revalidateQuizSurfaces(course.slug as string);
    redirect(`/admin/quizzes/${data.id}?created=1`);
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

export async function updateQuizAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const quizId = requiredString(formData, "quizId");
    const parsed = parseQuizForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data quiz.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: existing } = await context.db
      .from("quizzes")
      .select("id, title, course_id, passing_score, required")
      .eq("id", quizId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Quiz tidak ditemukan." };

    const { data: course } = await context.db
      .from("courses")
      .select("slug")
      .eq("id", existing.course_id as string)
      .maybeSingle();

    const { count: attemptCount } = await context.db
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", quizId);

    const scoringChanged =
      Number(existing.passing_score) !== parsed.data.passingScore ||
      Boolean(existing.required) !== parsed.data.required;

    const { error } = await context.db
      .from("quizzes")
      .update({
        title: parsed.data.title,
        description: parsed.data.description,
        passing_score: parsed.data.passingScore,
        required: parsed.data.required,
      })
      .eq("id", quizId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "quiz.updated",
      targetType: "quiz",
      targetId: quizId,
      metadata: {
        title: parsed.data.title,
        passingScore: parsed.data.passingScore,
        scoringChanged,
        existingAttempts: attemptCount ?? 0,
      },
    });

    revalidateQuizSurfaces(course?.slug as string | undefined);
    return {
      status: "success",
      message: scoringChanged
        ? "Quiz diperbarui. Perubahan aturan nilai hanya berlaku untuk percobaan berikutnya; percobaan dan sertifikat lama tidak diubah."
        : "Quiz diperbarui.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function createQuestionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const parsed = parseQuestionForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali pertanyaan.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: quiz } = await context.db
      .from("quizzes")
      .select("id, course_id, title")
      .eq("id", parsed.data.quizId)
      .maybeSingle();
    if (!quiz) return { status: "error", message: "Quiz tidak ditemukan." };

    const { data: last } = await context.db
      .from("quiz_questions")
      .select("position")
      .eq("quiz_id", parsed.data.quizId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await context.db
      .from("quiz_questions")
      .insert({
        quiz_id: parsed.data.quizId,
        prompt: parsed.data.prompt,
        code: parsed.data.code || null,
        code_language: parsed.data.code ? (parsed.data.codeLanguage ?? null) : null,
        options: parsed.data.options,
        correct_option_id: parsed.data.correctOptionId,
        explanation: parsed.data.explanation,
        weight: parsed.data.weight,
        position: Number(last?.position ?? 0) + 1,
      })
      .select("id")
      .single();

    if (error || !data) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "question.created",
      targetType: "question",
      targetId: data.id as string,
      metadata: {
        quiz: quiz.title as string,
        weight: parsed.data.weight,
        optionCount: parsed.data.options.length,
        // Never log the answer key into the audit trail body.
        promptExcerpt: parsed.data.prompt.slice(0, 80),
      },
    });

    revalidatePath(`/admin/quizzes/${parsed.data.quizId}`);
    await revalidateCourse(parsed.data.quizId, context);
    return { status: "success", message: "Pertanyaan ditambahkan." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function updateQuestionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const questionId = requiredString(formData, "questionId");
    const parsed = parseQuestionForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali pertanyaan.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: existing } = await context.db
      .from("quiz_questions")
      .select("id, quiz_id, correct_option_id, weight")
      .eq("id", questionId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Pertanyaan tidak ditemukan." };

    const scoringChanged =
      existing.correct_option_id !== parsed.data.correctOptionId ||
      Number(existing.weight) !== parsed.data.weight;

    const { error } = await context.db
      .from("quiz_questions")
      .update({
        prompt: parsed.data.prompt,
        code: parsed.data.code || null,
        code_language: parsed.data.code ? (parsed.data.codeLanguage ?? null) : null,
        options: parsed.data.options,
        correct_option_id: parsed.data.correctOptionId,
        explanation: parsed.data.explanation,
        weight: parsed.data.weight,
      })
      .eq("id", questionId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "question.updated",
      targetType: "question",
      targetId: questionId,
      metadata: {
        weight: parsed.data.weight,
        scoringChanged,
        promptExcerpt: parsed.data.prompt.slice(0, 80),
      },
    });

    revalidatePath(`/admin/quizzes/${parsed.data.quizId}`);
    await revalidateCourse(parsed.data.quizId, context);

    return {
      status: "success",
      message: scoringChanged
        ? "Pertanyaan diperbarui. Bobot/jawaban baru hanya berlaku untuk percobaan berikutnya; skor dan sertifikat lama tidak berubah."
        : "Pertanyaan diperbarui.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function deleteQuestionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const questionId = requiredString(formData, "questionId");
    const { data: question } = await context.db
      .from("quiz_questions")
      .select("id, quiz_id, prompt")
      .eq("id", questionId)
      .maybeSingle();
    if (!question) return { status: "error", message: "Pertanyaan tidak ditemukan." };

    const { count } = await context.db
      .from("quiz_attempts")
      .select("id", { count: "exact", head: true })
      .eq("quiz_id", question.quiz_id as string);

    if ((count ?? 0) > 0) {
      return {
        status: "error",
        message:
          "Quiz ini sudah memiliki percobaan. Pertanyaan tidak dihapus agar bukti penilaian lama tetap utuh; ubah pertanyaannya bila perlu.",
      };
    }

    const { error } = await context.db
      .from("quiz_questions")
      .delete()
      .eq("id", questionId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "question.deleted",
      targetType: "question",
      targetId: questionId,
      metadata: { promptExcerpt: String(question.prompt).slice(0, 80) },
    });

    revalidatePath(`/admin/quizzes/${question.quiz_id}`);
    await revalidateCourse(question.quiz_id as string, context);
    return { status: "success", message: "Pertanyaan dihapus." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function moveQuestionAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const questionId = requiredString(formData, "questionId");
    const direction = requiredString(formData, "direction");
    if (direction !== "up" && direction !== "down") {
      return { status: "error", message: "Arah perpindahan tidak valid." };
    }

    const { data: question } = await context.db
      .from("quiz_questions")
      .select("id, quiz_id")
      .eq("id", questionId)
      .maybeSingle();
    if (!question) return { status: "error", message: "Pertanyaan tidak ditemukan." };

    const { data: siblings } = await context.db
      .from("quiz_questions")
      .select("id")
      .eq("quiz_id", question.quiz_id as string)
      .order("position", { ascending: true });
    if (!siblings) return { status: "error", message: "Daftar pertanyaan tidak terbaca." };

    const ids = siblings.map((row) => row.id as string);
    const index = ids.indexOf(questionId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= ids.length) {
      return { status: "error", message: "Posisi pertanyaan tidak bisa digeser lagi." };
    }
    [ids[index], ids[swapWith]] = [ids[swapWith]!, ids[index]!];

    const { error } = await context.db.rpc("admin_reorder_questions", {
      p_quiz_id: question.quiz_id as string,
      p_ordered_ids: ids,
    });
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "question.reordered",
      targetType: "question",
      targetId: questionId,
      metadata: { direction },
    });

    revalidatePath(`/admin/quizzes/${question.quiz_id}`);
    return { status: "success", message: "Urutan pertanyaan diperbarui." };
  } catch (error) {
    return adminErrorState(error);
  }
}

async function revalidateCourse(
  quizId: string,
  context: Awaited<ReturnType<typeof requireAdminAction>>,
) {
  const { data: quiz } = await context.db
    .from("quizzes")
    .select("course_id")
    .eq("id", quizId)
    .maybeSingle();
  if (!quiz) return;
  const { data: course } = await context.db
    .from("courses")
    .select("slug")
    .eq("id", quiz.course_id as string)
    .maybeSingle();
  revalidateQuizSurfaces(course?.slug as string | undefined);
}

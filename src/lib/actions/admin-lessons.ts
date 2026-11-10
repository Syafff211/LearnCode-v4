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
import {
  lessonPublishBlockers,
  parseLessonForm,
  type LessonInput,
} from "@/lib/validation/admin";
import { parseYouTubeVideoId } from "@/lib/youtube";

function buildCodeExample(input: LessonInput) {
  if (!input.code.trim()) return {};
  return {
    language: input.codeLanguage ?? "html",
    ...(input.codeFilename ? { filename: input.codeFilename } : {}),
    ...(input.codeCaption ? { caption: input.codeCaption } : {}),
    code: input.code,
  };
}

function buildExercise(input: LessonInput) {
  const hasExercise =
    input.exerciseTitle || input.exerciseBrief || input.exerciseSteps.length > 0;
  if (!hasExercise) return {};
  return {
    ...(input.exerciseTitle ? { title: input.exerciseTitle } : {}),
    ...(input.exerciseBrief ? { brief: input.exerciseBrief } : {}),
    ...(input.exerciseSteps.length > 0 ? { steps: input.exerciseSteps } : {}),
    ...(input.exerciseHint ? { hint: input.exerciseHint } : {}),
    starter: {
      ...(input.starterHtml ? { html: input.starterHtml } : {}),
      ...(input.starterCss ? { css: input.starterCss } : {}),
      ...(input.starterJs ? { js: input.starterJs } : {}),
    },
  };
}

function buildYouTubeVideo(input: LessonInput) {
  const videoId = parseYouTubeVideoId(input.youtubeUrl);
  return {
    youtube_video_id: videoId,
    youtube_video_title: videoId && input.youtubeTitle ? input.youtubeTitle : null,
    youtube_video_description:
      videoId && input.youtubeDescription ? input.youtubeDescription : null,
  };
}

function revalidateLessonSurfaces(courseSlug?: string, lessonSlug?: string) {
  revalidatePath("/admin/lessons");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/dashboard");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  if (courseSlug) revalidatePath(`/courses/${courseSlug}`);
  if (lessonSlug) revalidatePath(`/learn/${lessonSlug}`);
}

export async function createLessonAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const parsed = parseLessonForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data lesson.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }
    if (parsed.data.status === "published") {
      const [blocker] = lessonPublishBlockers(parsed.data);
      if (blocker) return { status: "error", message: blocker };
    }

    const { data: course } = await context.db
      .from("courses")
      .select("id, slug, title")
      .eq("id", parsed.data.courseId)
      .maybeSingle();
    if (!course) return { status: "error", message: "Kursus induk tidak ditemukan." };

    const { data: last } = await context.db
      .from("lessons")
      .select("position")
      .eq("course_id", parsed.data.courseId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await context.db
      .from("lessons")
      .insert({
        course_id: parsed.data.courseId,
        title: parsed.data.title,
        slug: parsed.data.slug,
        summary: parsed.data.summary,
        content_md: parsed.data.contentMd,
        objectives: parsed.data.objectives,
        estimated_minutes: parsed.data.estimatedMinutes,
        required: parsed.data.required,
        status: parsed.data.status,
        position: Number(last?.position ?? 0) + 1,
        code_example: buildCodeExample(parsed.data),
        exercise: buildExercise(parsed.data),
        ...buildYouTubeVideo(parsed.data),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[admin] lesson insert failed", error?.code, error?.message);
      return adminErrorState(error);
    }

    await recordAdminAudit(context, {
      action: "lesson.created",
      targetType: "lesson",
      targetId: data.id as string,
      metadata: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        course: course.title as string,
        status: parsed.data.status,
      },
    });

    revalidateLessonSurfaces(course.slug as string, parsed.data.slug);
    redirect(`/admin/lessons/${data.id}?created=1`);
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

export async function updateLessonAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const lessonId = requiredString(formData, "lessonId");
    if (!/^[0-9a-f-]{36}$/i.test(lessonId)) {
      return { status: "error", message: "Lesson tidak valid." };
    }

    const parsed = parseLessonForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data lesson.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }
    if (parsed.data.status === "published") {
      const [blocker] = lessonPublishBlockers(parsed.data);
      if (blocker) return { status: "error", message: blocker };
    }

    const { data: existing } = await context.db
      .from("lessons")
      .select("id, slug, status, course_id, title")
      .eq("id", lessonId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Lesson tidak ditemukan." };

    if (parsed.data.courseId !== existing.course_id) {
      return {
        status: "error",
        message:
          "Lesson tidak bisa dipindah kursus dari sini karena posisi dan riwayat belajar terikat ke kursus lama.",
      };
    }

    const { error } = await context.db
      .from("lessons")
      .update({
        title: parsed.data.title,
        slug: parsed.data.slug,
        summary: parsed.data.summary,
        content_md: parsed.data.contentMd,
        objectives: parsed.data.objectives,
        estimated_minutes: parsed.data.estimatedMinutes,
        required: parsed.data.required,
        status: parsed.data.status,
        code_example: buildCodeExample(parsed.data),
        exercise: buildExercise(parsed.data),
        ...buildYouTubeVideo(parsed.data),
      })
      .eq("id", lessonId);

    if (error) {
      console.error("[admin] lesson update failed", error.code, error.message);
      return adminErrorState(error);
    }

    const { data: course } = await context.db
      .from("courses")
      .select("slug")
      .eq("id", existing.course_id as string)
      .maybeSingle();

    const statusChanged = existing.status !== parsed.data.status;
    await recordAdminAudit(context, {
      action: statusChanged ? "lesson.status_changed" : "lesson.updated",
      targetType: "lesson",
      targetId: lessonId,
      metadata: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        status: parsed.data.status,
        ...(statusChanged ? { from: existing.status, to: parsed.data.status } : {}),
      },
    });

    revalidateLessonSurfaces(course?.slug as string | undefined, parsed.data.slug);
    if (existing.slug !== parsed.data.slug) {
      revalidateLessonSurfaces(course?.slug as string | undefined, existing.slug as string);
    }

    return { status: "success", message: "Lesson diperbarui." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function setLessonStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const lessonId = requiredString(formData, "lessonId");
    const status = requiredString(formData, "status");
    if (status !== "draft" && status !== "published" && status !== "archived") {
      return { status: "error", message: "Status lesson tidak valid." };
    }

    const { data: lesson } = await context.db
      .from("lessons")
      .select("id, title, slug, status, course_id, content_md, code_example")
      .eq("id", lessonId)
      .maybeSingle();
    if (!lesson) return { status: "error", message: "Lesson tidak ditemukan." };

    if (status === "published") {
      const content = String(lesson.content_md ?? "");
      if (content.trim().length < 80) {
        return {
          status: "error",
          message: "Isi lesson terlalu pendek untuk dipublikasikan. Lengkapi materinya dulu.",
        };
      }
      const codeExample = (lesson.code_example ?? {}) as { code?: string; language?: string };
      if (codeExample.code && !codeExample.language) {
        return { status: "error", message: "Contoh kode belum memiliki bahasa." };
      }
    }

    const { error } = await context.db.from("lessons").update({ status }).eq("id", lessonId);
    if (error) return adminErrorState(error);

    const { data: course } = await context.db
      .from("courses")
      .select("slug")
      .eq("id", lesson.course_id as string)
      .maybeSingle();

    await recordAdminAudit(context, {
      action: "lesson.status_changed",
      targetType: "lesson",
      targetId: lessonId,
      metadata: { title: lesson.title, from: lesson.status, to: status },
    });

    revalidateLessonSurfaces(course?.slug as string | undefined, lesson.slug as string);
    return {
      status: "success",
      message:
        status === "published"
          ? "Lesson dipublikasikan."
          : status === "archived"
            ? "Lesson diarsipkan."
            : "Lesson dikembalikan ke draft.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function deleteLessonAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const lessonId = requiredString(formData, "lessonId");
    const confirmation = requiredString(formData, "confirmation");

    const { data: lesson } = await context.db
      .from("lessons")
      .select("id, title, slug, course_id")
      .eq("id", lessonId)
      .maybeSingle();
    if (!lesson) return { status: "error", message: "Lesson tidak ditemukan." };

    if (confirmation !== lesson.slug) {
      return {
        status: "error",
        message: "Ketik slug lesson persis untuk mengonfirmasi penghapusan.",
      };
    }

    const { count } = await context.db
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("lesson_id", lessonId);
    if ((count ?? 0) > 0) {
      return {
        status: "error",
        message:
          "Lesson ini sudah diselesaikan peserta. Arsipkan lesson agar riwayat belajar tidak hilang.",
      };
    }

    const { error } = await context.db.from("lessons").delete().eq("id", lessonId);
    if (error) {
      if (error.message.includes("lesson_has_progress")) {
        return { status: "error", message: "Lesson memiliki riwayat belajar. Gunakan arsip." };
      }
      return adminErrorState(error);
    }

    const { data: course } = await context.db
      .from("courses")
      .select("slug")
      .eq("id", lesson.course_id as string)
      .maybeSingle();

    await recordAdminAudit(context, {
      action: "lesson.deleted",
      targetType: "lesson",
      targetId: lessonId,
      metadata: { title: lesson.title, slug: lesson.slug },
    });

    revalidateLessonSurfaces(course?.slug as string | undefined, lesson.slug as string);
    redirect("/admin/lessons?deleted=1");
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

export async function moveLessonAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const lessonId = requiredString(formData, "lessonId");
    const direction = requiredString(formData, "direction");
    if (direction !== "up" && direction !== "down") {
      return { status: "error", message: "Arah perpindahan tidak valid." };
    }

    const { data: lesson } = await context.db
      .from("lessons")
      .select("id, course_id")
      .eq("id", lessonId)
      .maybeSingle();
    if (!lesson) return { status: "error", message: "Lesson tidak ditemukan." };

    const { data: siblings } = await context.db
      .from("lessons")
      .select("id")
      .eq("course_id", lesson.course_id as string)
      .order("position", { ascending: true });
    if (!siblings) return { status: "error", message: "Daftar lesson tidak terbaca." };

    const ids = siblings.map((row) => row.id as string);
    const index = ids.indexOf(lessonId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= ids.length) {
      return { status: "error", message: "Posisi lesson tidak bisa digeser lagi." };
    }
    [ids[index], ids[swapWith]] = [ids[swapWith]!, ids[index]!];

    const { error } = await context.db.rpc("admin_reorder_lessons", {
      p_course_id: lesson.course_id as string,
      p_ordered_ids: ids,
    });
    if (error) {
      console.error("[admin] lesson reorder failed", error.message);
      return adminErrorState(error);
    }

    await recordAdminAudit(context, {
      action: "lesson.reordered",
      targetType: "lesson",
      targetId: lessonId,
      metadata: { direction },
    });

    const { data: course } = await context.db
      .from("courses")
      .select("slug")
      .eq("id", lesson.course_id as string)
      .maybeSingle();
    revalidateLessonSurfaces(course?.slug as string | undefined);
    return { status: "success", message: "Urutan lesson diperbarui." };
  } catch (error) {
    return adminErrorState(error);
  }
}

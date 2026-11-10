"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction, AdminAccessError } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import {
  adminErrorState,
  checkAdminRateLimit,
  requiredString,
  zodFieldErrors,
  type AdminActionState,
} from "@/lib/actions/admin-shared";
import {
  coursePublishBlockers,
  parseCourseForm,
  type CourseInput,
} from "@/lib/validation/admin";

function revalidateCourseSurfaces(slug?: string) {
  revalidatePath("/admin/courses");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/lessons");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  if (slug) revalidatePath(`/courses/${slug}`);
}

async function publishedLessonCount(
  db: Awaited<ReturnType<typeof requireAdminAction>>["db"],
  courseId: string,
): Promise<number> {
  const { count } = await db
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("status", "published");
  return count ?? 0;
}

async function assertPublishable(
  db: Awaited<ReturnType<typeof requireAdminAction>>["db"],
  courseId: string,
  input: CourseInput,
): Promise<string | null> {
  const blockers = coursePublishBlockers(input);
  if (blockers.length > 0) return blockers[0] ?? null;
  const lessons = await publishedLessonCount(db, courseId);
  if (lessons === 0) {
    return "Publikasikan minimal satu lesson sebelum kursus ini tampil ke peserta.";
  }
  return null;
}

export async function createCourseAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const parsed = parseCourseForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data kursus.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data, error } = await context.db
      .from("courses")
      .insert({
        title: parsed.data.title,
        slug: parsed.data.slug,
        tagline: parsed.data.tagline,
        description: parsed.data.description,
        level: parsed.data.level,
        language: parsed.data.language,
        duration_minutes: parsed.data.durationMinutes,
        objectives: parsed.data.objectives,
        passing_score: parsed.data.passingScore,
        require_all_lessons: parsed.data.requireAllLessons,
        position: parsed.data.position,
        // New courses always start as drafts; publishing is its own validated step.
        status: "draft",
      })
      .select("id, slug")
      .single();

    if (error || !data) {
      if (error) console.error("[admin] course insert failed", error.code, error.message);
      return adminErrorState(error);
    }

    await recordAdminAudit(context, {
      action: "course.created",
      targetType: "course",
      targetId: data.id as string,
      metadata: { title: parsed.data.title, slug: parsed.data.slug, level: parsed.data.level },
    });

    revalidateCourseSurfaces();
    redirect(`/admin/courses/${data.id}?created=1`);
  } catch (error) {
    if (error instanceof AdminAccessError) return adminErrorState(error);
    // Let Next.js redirect errors through untouched.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

export async function updateCourseAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const courseId = requiredString(formData, "courseId");
    if (!/^[0-9a-f-]{36}$/i.test(courseId)) {
      return { status: "error", message: "Kursus tidak valid." };
    }

    const parsed = parseCourseForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data kursus.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: existing } = await context.db
      .from("courses")
      .select("id, title, slug, status")
      .eq("id", courseId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Kursus tidak ditemukan." };

    if (parsed.data.status === "published") {
      const blocker = await assertPublishable(context.db, courseId, parsed.data);
      if (blocker) return { status: "error", message: blocker };
    }

    const { error } = await context.db
      .from("courses")
      .update({
        title: parsed.data.title,
        slug: parsed.data.slug,
        tagline: parsed.data.tagline,
        description: parsed.data.description,
        level: parsed.data.level,
        language: parsed.data.language,
        duration_minutes: parsed.data.durationMinutes,
        objectives: parsed.data.objectives,
        passing_score: parsed.data.passingScore,
        require_all_lessons: parsed.data.requireAllLessons,
        position: parsed.data.position,
        status: parsed.data.status,
      })
      .eq("id", courseId);

    if (error) {
      console.error("[admin] course update failed", error.code, error.message);
      return adminErrorState(error);
    }

    const statusChanged = existing.status !== parsed.data.status;
    await recordAdminAudit(context, {
      action: statusChanged ? "course.status_changed" : "course.updated",
      targetType: "course",
      targetId: courseId,
      metadata: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        status: parsed.data.status,
        ...(statusChanged ? { from: existing.status, to: parsed.data.status } : {}),
      },
    });

    revalidateCourseSurfaces(parsed.data.slug);
    if (existing.slug !== parsed.data.slug) revalidateCourseSurfaces(existing.slug);

    return { status: "success", message: "Kursus diperbarui." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function setCourseStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const courseId = requiredString(formData, "courseId");
    const status = requiredString(formData, "status");
    if (status !== "draft" && status !== "published" && status !== "archived") {
      return { status: "error", message: "Status kursus tidak valid." };
    }

    const { data: existing } = await context.db
      .from("courses")
      .select("id, title, slug, status, description, objectives, duration_minutes")
      .eq("id", courseId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Kursus tidak ditemukan." };

    if (status === "published") {
      const blocker = await assertPublishable(context.db, courseId, {
        description: existing.description as string,
        objectives: (existing.objectives as string[] | null) ?? [],
        durationMinutes: Number(existing.duration_minutes),
      } as CourseInput);
      if (blocker) return { status: "error", message: blocker };
    }

    const { error } = await context.db
      .from("courses")
      .update({ status })
      .eq("id", courseId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "course.status_changed",
      targetType: "course",
      targetId: courseId,
      metadata: { title: existing.title, from: existing.status, to: status },
    });

    revalidateCourseSurfaces(existing.slug as string);
    return {
      status: "success",
      message:
        status === "published"
          ? "Kursus dipublikasikan."
          : status === "archived"
            ? "Kursus diarsipkan dan tidak lagi tampil di katalog."
            : "Kursus dikembalikan ke draft.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function deleteCourseAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const courseId = requiredString(formData, "courseId");
    const confirmation = requiredString(formData, "confirmation");

    const { data: existing } = await context.db
      .from("courses")
      .select("id, title, slug")
      .eq("id", courseId)
      .maybeSingle();
    if (!existing) return { status: "error", message: "Kursus tidak ditemukan." };

    // Typing the slug makes accidental deletion harder than a single click.
    if (confirmation !== existing.slug) {
      return {
        status: "error",
        message: "Ketik slug kursus persis seperti yang tertulis untuk mengonfirmasi.",
      };
    }

    const [{ count: progress }, { count: attempts }, { count: certs }] = await Promise.all([
      context.db
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId),
      context.db
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId),
      context.db
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .eq("course_id", courseId),
    ]);

    if ((progress ?? 0) + (attempts ?? 0) + (certs ?? 0) > 0) {
      return {
        status: "error",
        message:
          "Kursus ini sudah punya riwayat peserta, percobaan quiz, atau sertifikat. Arsipkan kursus agar riwayat tetap utuh.",
      };
    }

    const { error } = await context.db.from("courses").delete().eq("id", courseId);
    if (error) {
      if (error.message.includes("course_has_")) {
        return { status: "error", message: "Kursus memiliki riwayat belajar. Gunakan arsip." };
      }
      return adminErrorState(error);
    }

    await recordAdminAudit(context, {
      action: "course.deleted",
      targetType: "course",
      targetId: courseId,
      metadata: { title: existing.title, slug: existing.slug },
    });

    revalidateCourseSurfaces(existing.slug as string);
    redirect("/admin/courses?deleted=1");
  } catch (error) {
    const digest = (error as { digest?: string } | null)?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return adminErrorState(error);
  }
}

export async function moveCourseAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const courseId = requiredString(formData, "courseId");
    const direction = requiredString(formData, "direction");
    if (direction !== "up" && direction !== "down") {
      return { status: "error", message: "Arah perpindahan tidak valid." };
    }

    const { data: courses } = await context.db
      .from("courses")
      .select("id, position")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (!courses) return { status: "error", message: "Daftar kursus tidak terbaca." };

    const index = courses.findIndex((row) => row.id === courseId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= courses.length) {
      return { status: "error", message: "Posisi kursus tidak bisa digeser lagi." };
    }

    const a = courses[index]!;
    const b = courses[swapWith]!;
    const { error } = await context.db
      .from("courses")
      .update({ position: b.position })
      .eq("id", a.id);
    if (error) return adminErrorState(error);
    const { error: secondError } = await context.db
      .from("courses")
      .update({ position: a.position })
      .eq("id", b.id);
    if (secondError) return adminErrorState(secondError);

    await recordAdminAudit(context, {
      action: "course.updated",
      targetType: "course",
      targetId: courseId,
      metadata: { reorder: direction },
    });

    revalidateCourseSurfaces();
    return { status: "success", message: "Urutan kursus diperbarui." };
  } catch (error) {
    return adminErrorState(error);
  }
}

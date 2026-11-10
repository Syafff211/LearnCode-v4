"use server";

import { revalidatePath } from "next/cache";

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
  parseAiSettingsForm,
  parsePlatformSettingsForm,
  revokeCertificateSchema,
  suspendUserSchema,
} from "@/lib/validation/admin";

export async function suspendUserAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const parsed = suspendUserSchema.safeParse({
      userId: formData.get("userId"),
      reason: formData.get("reason"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa alasan penonaktifan (minimal 5 karakter).",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { userId, reason } = parsed.data;
    if (userId === context.user.id) {
      return { status: "error", message: "Kamu tidak bisa menonaktifkan akun sendiri." };
    }

    const { data: target } = await context.db
      .from("profiles")
      .select("id, full_name, role, suspended_at")
      .eq("id", userId)
      .maybeSingle();
    if (!target) return { status: "error", message: "Pengguna tidak ditemukan." };
    if (target.suspended_at) {
      return { status: "error", message: "Akun ini sudah dalam status nonaktif." };
    }

    if (target.role === "admin") {
      const { count } = await context.db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .is("suspended_at", null);
      if ((count ?? 0) <= 1) {
        return {
          status: "error",
          message:
            "Ini admin aktif terakhir. Tambahkan admin lain lewat prosedur bootstrap sebelum menonaktifkannya.",
        };
      }
    }

    const { error } = await context.db
      .from("profiles")
      .update({
        suspended_at: new Date().toISOString(),
        suspended_reason: reason,
        suspended_by: context.user.id,
      })
      .eq("id", userId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "user.suspended",
      targetType: "user",
      targetId: userId,
      reason,
      metadata: { fullName: target.full_name, role: target.role },
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");
    return {
      status: "success",
      message: "Akun dinonaktifkan. Sesi berikutnya akan ditolak saat memuat data.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function reactivateUserAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const userId = requiredString(formData, "userId");
    const { data: target } = await context.db
      .from("profiles")
      .select("id, full_name, suspended_at, suspended_reason")
      .eq("id", userId)
      .maybeSingle();
    if (!target) return { status: "error", message: "Pengguna tidak ditemukan." };
    if (!target.suspended_at) {
      return { status: "error", message: "Akun ini memang sedang aktif." };
    }

    const { error } = await context.db
      .from("profiles")
      .update({ suspended_at: null, suspended_reason: null, suspended_by: null })
      .eq("id", userId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "user.reactivated",
      targetType: "user",
      targetId: userId,
      metadata: {
        fullName: target.full_name,
        previousReason: target.suspended_reason,
      },
    });

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");
    return { status: "success", message: "Akses akun diaktifkan kembali." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function revokeCertificateAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const parsed = revokeCertificateSchema.safeParse({
      certificateId: formData.get("certificateId"),
      reason: formData.get("reason"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Alasan pencabutan wajib diisi (minimal 10 karakter).",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: certificate } = await context.db
      .from("certificates")
      .select("id, certificate_number, course_title_snapshot, revoked_at")
      .eq("id", parsed.data.certificateId)
      .maybeSingle();
    if (!certificate) return { status: "error", message: "Sertifikat tidak ditemukan." };
    if (certificate.revoked_at) {
      return { status: "error", message: "Sertifikat ini sudah dicabut sebelumnya." };
    }

    const { error } = await context.db
      .from("certificates")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: context.user.id,
        revocation_reason: parsed.data.reason,
      })
      .eq("id", parsed.data.certificateId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "certificate.revoked",
      targetType: "certificate",
      targetId: certificate.id as string,
      reason: parsed.data.reason,
      metadata: {
        certificateNumber: certificate.certificate_number,
        course: certificate.course_title_snapshot,
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath("/admin/dashboard");
    revalidatePath("/verify", "layout");
    return {
      status: "success",
      message:
        "Sertifikat dicabut. Riwayat tetap tersimpan dan halaman verifikasi kini menampilkan status tidak berlaku.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function updateAiSettingsAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const parsed = parseAiSettingsForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali pengaturan AI.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: previous } = await context.db
      .from("ai_settings")
      .select("enabled, daily_message_limit, max_input_chars, max_output_tokens, model, features, learning_instructions")
      .eq("id", 1)
      .maybeSingle();

    const { error } = await context.db
      .from("ai_settings")
      .update({
        enabled: parsed.data.enabled,
        daily_message_limit: parsed.data.dailyMessageLimit,
        max_input_chars: parsed.data.maxInputChars,
        max_output_tokens: parsed.data.maxOutputTokens,
        model: parsed.data.model,
        features: parsed.data.features,
        learning_instructions: parsed.data.learningInstructions,
        updated_by: context.user.id,
      })
      .eq("id", 1);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "ai_settings.updated",
      targetType: "settings",
      targetId: "ai_settings",
      metadata: {
        enabled: parsed.data.enabled,
        dailyMessageLimit: parsed.data.dailyMessageLimit,
        maxInputChars: parsed.data.maxInputChars,
        maxOutputTokens: parsed.data.maxOutputTokens,
        model: parsed.data.model,
        features: parsed.data.features,
        previousModel: previous?.model ?? null,
        previousEnabled: previous?.enabled ?? null,
        instructionsChanged:
          parsed.data.learningInstructions !==
          String((previous as { learning_instructions?: string } | null)?.learning_instructions ?? ""),
        // The Groq API key is never read, logged, or stored here.
      },
    });

    revalidatePath("/admin/ai-settings");
    revalidatePath("/ai-tutor");
    revalidatePath("/admin/dashboard");
    return {
      status: "success",
      message:
        "Pengaturan AI disimpan dan langsung berlaku pada permintaan AI berikutnya.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function updatePlatformSettingsAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const parsed = parsePlatformSettingsForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali pengaturan platform.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { error } = await context.db
      .from("platform_settings")
      .update({
        platform_name: parsed.data.platformName,
        short_description: parsed.data.shortDescription,
        logo_url: parsed.data.logoUrl || null,
        favicon_url: parsed.data.faviconUrl || null,
        default_language: parsed.data.defaultLanguage,
        certificate_signature: parsed.data.certificateSignature,
        default_passing_score: parsed.data.defaultPassingScore,
        contact_email: parsed.data.contactEmail || null,
        contact_url: parsed.data.contactUrl || null,
        maintenance_mode: parsed.data.maintenanceMode,
        maintenance_message: parsed.data.maintenanceMessage,
        updated_by: context.user.id,
      })
      .eq("id", 1);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "platform_settings.updated",
      targetType: "settings",
      targetId: "platform_settings",
      metadata: {
        platformName: parsed.data.platformName,
        defaultLanguage: parsed.data.defaultLanguage,
        defaultPassingScore: parsed.data.defaultPassingScore,
        maintenanceMode: parsed.data.maintenanceMode,
        contactEmail: parsed.data.contactEmail || null,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    return {
      status: "success",
      message: "Pengaturan platform disimpan.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

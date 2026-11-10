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
import { getSupabaseConfig } from "@/lib/env";
import { promotionalPopupIdSchema, parsePromotionalPopupForm } from "@/lib/validation/promotional-popup";
import type { PromotionalPopupInput } from "@/lib/validation/promotional-popup";

const POPUP_BUCKET = "promotion-assets";
const STORAGE_PATH_PATTERN = /^[0-9a-f-]{36}\/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f-]{36}\.webp$/i;

function utcTimestamp(value: string): string {
  return value ? new Date(`${value}:00Z`).toISOString() : new Date().toISOString();
}

function toPopupValues(input: PromotionalPopupInput, adminId: string, imageUrl: string | null) {
  return {
    internal_name: input.internalName,
    title: input.title,
    description: input.description,
    image_path: input.imagePath || null,
    image_url: imageUrl,
    image_alt: input.imagePath ? input.imageAlt : null,
    primary_button_text: input.primaryButtonText || null,
    primary_button_url: input.primaryButtonUrl || null,
    secondary_button_text: input.secondaryButtonText || null,
    secondary_button_url: input.secondaryButtonUrl || null,
    styling_config: {
      backgroundColor: input.backgroundColor,
      textColor: input.textColor,
      buttonColor: input.buttonColor,
      buttonTextColor: input.buttonTextColor,
      position: input.position,
      size: input.size,
      backdropClose: input.backdropClose,
    },
    display_config: {
      pageTargets: input.pageTargets,
      customPaths: input.pageTargets.includes("custom") ? input.customPaths : [],
    },
    popup_type: input.popupType,
    frequency: input.frequency,
    audience: input.audience,
    priority: input.priority,
    is_active: input.isActive,
    starts_at: utcTimestamp(input.startsAt),
    ends_at: input.endsAt ? utcTimestamp(input.endsAt) : null,
    updated_by: adminId,
  };
}

async function resolveStorageImageUrl(
  db: Awaited<ReturnType<typeof requireAdminAction>>["db"],
  path: string,
  adminId: string,
  previousPath: string | null,
): Promise<{ url: string | null; error: string | null }> {
  if (!path) return { url: null, error: null };
  if (!STORAGE_PATH_PATTERN.test(path)) {
    return { url: null, error: "Path gambar Storage tidak valid. Unggah ulang gambar dari form." };
  }
  if (path !== previousPath && !path.startsWith(`${adminId}/`)) {
    return { url: null, error: "Gambar baru harus diunggah melalui sesi admin ini." };
  }

  const [folder, fileName] = path.split("/");
  const { data: files, error: listError } = await db.storage
    .from(POPUP_BUCKET)
    .list(folder, { limit: 100, search: fileName });
  const asset = files?.find((file) => file.name === fileName);
  const metadata = (asset?.metadata ?? {}) as Record<string, unknown>;
  const fileSize = Number(metadata.size);
  if (listError || !asset || metadata.mimetype !== "image/webp" || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > 5 * 1024 * 1024) {
    return { url: null, error: "File gambar tidak ditemukan di bucket promotion-assets atau format/ukurannya tidak valid." };
  }

  const url = db.storage.from(POPUP_BUCKET).getPublicUrl(path).data.publicUrl;
  if (!isAllowedPublicStorageUrl(url)) {
    return { url: null, error: "URL gambar bukan berasal dari Supabase Storage yang dikonfigurasi." };
  }
  return { url, error: null };
}

function isAllowedPublicStorageUrl(value: string): boolean {
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const expected = new URL(config.url);
    const actual = new URL(value);
    return actual.origin === expected.origin && actual.pathname.includes("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

async function removeStorageObject(
  db: Awaited<ReturnType<typeof requireAdminAction>>["db"],
  path: string | null,
) {
  if (!path) return;
  const { error } = await db.storage.from(POPUP_BUCKET).remove([path]);
  if (error) console.error("[admin] popup media cleanup failed", error.message);
}

function revalidatePopupSurfaces(popupId?: string) {
  revalidatePath("/admin/popups");
  if (popupId) revalidatePath(`/admin/popups/${popupId}`);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/playground");
  revalidatePath("/ai-tutor");
}

export async function createPromotionalPopupAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const parsed = parsePromotionalPopupForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali konfigurasi popup.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }
    const asset = await resolveStorageImageUrl(context.db, parsed.data.imagePath, context.user.id, null);
    if (asset.error) return { status: "error", message: asset.error };

    const { data, error } = await context.db
      .from("promotional_popups")
      .insert({ ...toPopupValues(parsed.data, context.user.id, asset.url), is_primary: false, created_by: context.user.id })
      .select("id")
      .single();
    if (error || !data) return adminErrorState(error);

    let primaryWarning = "";
    if (parsed.data.isPrimary) {
      const { error: primaryError } = await context.db.rpc("set_primary_promotional_popup", { p_popup_id: data.id });
      if (primaryError) {
        console.error("[admin] set primary popup failed", primaryError.message);
        primaryWarning = " Popup tersimpan, tetapi belum dapat ditetapkan sebagai popup utama.";
      }
    }

    await recordAdminAudit(context, {
      action: "promotion_popup.created",
      targetType: "promotion_popup",
      targetId: data.id,
      metadata: {
        internalName: parsed.data.internalName,
        title: parsed.data.title,
        isActive: parsed.data.isActive,
        isPrimary: parsed.data.isPrimary,
      },
    });
    revalidatePopupSurfaces(data.id);
    redirect(`/admin/popups/${data.id}?created=1${primaryWarning ? "&primaryWarning=1" : ""}`);
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

export async function updatePromotionalPopupAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const popupId = requiredString(formData, "popupId");
    if (!promotionalPopupIdSchema(popupId).success) return { status: "error", message: "Popup tidak valid." };
    const parsed = parsePromotionalPopupForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali konfigurasi popup.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }

    const { data: existing, error: existingError } = await context.db
      .from("promotional_popups")
      .select("id, internal_name, image_path, is_primary, is_active")
      .eq("id", popupId)
      .maybeSingle();
    if (existingError || !existing) return { status: "error", message: "Popup tidak ditemukan." };

    const oldPath = typeof existing.image_path === "string" ? existing.image_path : null;
    const asset = await resolveStorageImageUrl(context.db, parsed.data.imagePath, context.user.id, oldPath);
    if (asset.error) return { status: "error", message: asset.error };

    const { error } = await context.db
      .from("promotional_popups")
      .update(toPopupValues(parsed.data, context.user.id, asset.url))
      .eq("id", popupId);
    if (error) return adminErrorState(error);

    let primaryWarning = "";
    if (parsed.data.isPrimary !== Boolean(existing.is_primary)) {
      const { error: primaryError } = await context.db.rpc("set_primary_promotional_popup", {
        p_popup_id: parsed.data.isPrimary ? popupId : null,
      });
      if (primaryError) {
        console.error("[admin] set primary popup failed", primaryError.message);
        primaryWarning = " Popup tersimpan, tetapi status popup utamanya belum berubah.";
      }
    }

    if (oldPath && oldPath !== parsed.data.imagePath) await removeStorageObject(context.db, oldPath);
    await recordAdminAudit(context, {
      action: existing.is_active !== parsed.data.isActive ? "promotion_popup.status_changed" : "promotion_popup.updated",
      targetType: "promotion_popup",
      targetId: popupId,
      metadata: {
        internalName: parsed.data.internalName,
        title: parsed.data.title,
        isActive: parsed.data.isActive,
        isPrimary: parsed.data.isPrimary,
        priority: parsed.data.priority,
      },
    });
    revalidatePopupSurfaces(popupId);
    return { status: "success", message: primaryWarning ? primaryWarning.trim() : "Popup berhasil diperbarui." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function togglePromotionalPopupAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;
    const popupId = requiredString(formData, "popupId");
    const rawActive = requiredString(formData, "isActive");
    if (!promotionalPopupIdSchema(popupId).success || !["true", "false"].includes(rawActive)) {
      return { status: "error", message: "Data status popup tidak valid." };
    }
    const isActive = rawActive === "true";
    const { data: popup, error: readError } = await context.db
      .from("promotional_popups")
      .select("id, internal_name, title, is_active")
      .eq("id", popupId)
      .maybeSingle();
    if (readError || !popup) return { status: "error", message: "Popup tidak ditemukan." };
    const { error } = await context.db
      .from("promotional_popups")
      .update({ is_active: isActive, updated_by: context.user.id })
      .eq("id", popupId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "promotion_popup.status_changed",
      targetType: "promotion_popup",
      targetId: popupId,
      metadata: { internalName: popup.internal_name as string, from: popup.is_active as boolean, to: isActive },
    });
    revalidatePopupSurfaces(popupId);
    return { status: "success", message: isActive ? "Popup diaktifkan." : "Popup dinonaktifkan." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function deletePromotionalPopupAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const popupId = requiredString(formData, "popupId");
    const confirmation = requiredString(formData, "confirmation");
    if (!promotionalPopupIdSchema(popupId).success) return { status: "error", message: "Popup tidak valid." };
    const { data: popup, error: readError } = await context.db
      .from("promotional_popups")
      .select("id, internal_name, title, image_path")
      .eq("id", popupId)
      .maybeSingle();
    if (readError || !popup) return { status: "error", message: "Popup tidak ditemukan." };
    if (confirmation !== popup.internal_name) return { status: "error", message: "Konfirmasi nama internal tidak cocok." };

    const { error } = await context.db.from("promotional_popups").delete().eq("id", popupId);
    if (error) return adminErrorState(error);
    await removeStorageObject(context.db, typeof popup.image_path === "string" ? popup.image_path : null);

    await recordAdminAudit(context, {
      action: "promotion_popup.deleted",
      targetType: "promotion_popup",
      targetId: popupId,
      metadata: { internalName: popup.internal_name as string, title: popup.title as string },
    });
    revalidatePopupSurfaces();
    redirect("/admin/popups?deleted=1");
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

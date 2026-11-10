import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  PromotionAudience,
  PromotionDisplayConfig,
  PromotionFrequency,
  PromotionPopupAdmin,
  PromotionPosition,
  PromotionSize,
  PromotionType,
} from "@/lib/promotional-popup";

const POPUP_SELECT =
  "id, internal_name, title, description, image_path, image_url, image_alt, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, styling_config, display_config, popup_type, frequency, audience, priority, is_primary, is_active, starts_at, ends_at, created_at, updated_at";

type PopupRow = Record<string, unknown>;

function toAdminPopup(row: PopupRow): PromotionPopupAdmin {
  const style = (row.styling_config ?? {}) as Record<string, unknown>;
  const display = (row.display_config ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    internalName: String(row.internal_name),
    title: String(row.title),
    description: String(row.description ?? ""),
    imagePath: typeof row.image_path === "string" ? row.image_path : null,
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    imageAlt: typeof row.image_alt === "string" ? row.image_alt : null,
    primaryButtonText: typeof row.primary_button_text === "string" ? row.primary_button_text : null,
    primaryButtonUrl: typeof row.primary_button_url === "string" ? row.primary_button_url : null,
    secondaryButtonText: typeof row.secondary_button_text === "string" ? row.secondary_button_text : null,
    secondaryButtonUrl: typeof row.secondary_button_url === "string" ? row.secondary_button_url : null,
    stylingConfig: {
      backgroundColor: String(style.backgroundColor ?? "#faf9f5"),
      textColor: String(style.textColor ?? "#25251f"),
      buttonColor: String(style.buttonColor ?? "#a8d35b"),
      buttonTextColor: String(style.buttonTextColor ?? "#1a2012"),
      position: String(style.position ?? "center") as PromotionPosition,
      size: String(style.size ?? "normal") as PromotionSize,
      backdropClose: style.backdropClose !== false,
    },
    displayConfig: {
      pageTargets: Array.isArray(display.pageTargets) ? display.pageTargets as PromotionDisplayConfig["pageTargets"] : ["all_public"],
      customPaths: Array.isArray(display.customPaths) ? display.customPaths.filter((value): value is string => typeof value === "string") : [],
    },
    popupType: String(row.popup_type) as PromotionType,
    frequency: String(row.frequency) as PromotionFrequency,
    audience: String(row.audience) as PromotionAudience,
    priority: Number(row.priority ?? 0),
    isPrimary: Boolean(row.is_primary),
    isActive: Boolean(row.is_active),
    startsAt: String(row.starts_at),
    endsAt: typeof row.ends_at === "string" ? row.ends_at : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listAdminPromotionalPopups(db: SupabaseClient): Promise<{ rows: PromotionPopupAdmin[]; error: string | null }> {
  const { data, error } = await db
    .from("promotional_popups")
    .select(POPUP_SELECT)
    .order("priority", { ascending: false })
    .order("is_primary", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[admin] promotion popup list failed", error.message);
    return { rows: [], error: "Daftar popup gagal dimuat. Pastikan migration popup sudah diterapkan, lalu muat ulang." };
  }
  return { rows: (data ?? []).map((row) => toAdminPopup(row as PopupRow)), error: null };
}

export async function getAdminPromotionalPopup(
  db: SupabaseClient,
  popupId: string,
): Promise<PromotionPopupAdmin | null> {
  const { data, error } = await db
    .from("promotional_popups")
    .select(POPUP_SELECT)
    .eq("id", popupId)
    .maybeSingle();
  if (error) {
    console.error("[admin] promotion popup detail failed", error.message);
    return null;
  }
  return data ? toAdminPopup(data as PopupRow) : null;
}

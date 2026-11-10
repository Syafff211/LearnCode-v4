import { NextRequest, NextResponse } from "next/server";

import {
  isPromotionAudienceMatch,
  isPromotionPopupExcluded,
  isPromotionTargetMatch,
  isSafePromotionUrl,
  normalizePopupPath,
  PROMOTION_AUDIENCES,
  PROMOTION_FREQUENCIES,
  PROMOTION_PAGE_TARGETS,
  PROMOTION_POSITIONS,
  PROMOTION_SIZES,
  type PromotionDisplayConfig,
  type PromotionPopupPublic,
  type PromotionStyleConfig,
} from "@/lib/promotional-popup";
import { getOptionalUser } from "@/lib/auth";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function noStoreJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, private, max-age=0" },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isPublicStorageUrl(value: string, bucket: "promotion-assets"): boolean {
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const expected = new URL(config.url);
    const actual = new URL(value);
    return actual.origin === expected.origin && actual.pathname.startsWith(`/storage/v1/object/public/${bucket}/`);
  } catch {
    return false;
  }
}

function asPublicPopup(row: Record<string, unknown>): PromotionPopupPublic | null {
  const style = row.styling_config;
  const display = row.display_config;
  if (!isObject(style) || !isObject(display)) return null;
  if (
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.description !== "string" ||
    typeof row.frequency !== "string" ||
    typeof row.audience !== "string" ||
    !Array.isArray(display.pageTargets) ||
    !Array.isArray(display.customPaths)
  ) return null;
  if (!PROMOTION_FREQUENCIES.some((value) => value === row.frequency)) return null;
  if (!PROMOTION_AUDIENCES.some((value) => value === row.audience)) return null;
  if (display.pageTargets.some((item) => typeof item !== "string" || !PROMOTION_PAGE_TARGETS.some((value) => value === item))) return null;
  if (display.customPaths.some((item) => typeof item !== "string")) return null;

  const stylingConfig = style as unknown as PromotionStyleConfig;
  const displayConfig = display as unknown as PromotionDisplayConfig;
  const colorPattern = /^#[0-9a-f]{6}$/i;
  if (
    typeof stylingConfig.backgroundColor !== "string" || !colorPattern.test(stylingConfig.backgroundColor) ||
    typeof stylingConfig.textColor !== "string" || !colorPattern.test(stylingConfig.textColor) ||
    typeof stylingConfig.buttonColor !== "string" || !colorPattern.test(stylingConfig.buttonColor) ||
    typeof stylingConfig.buttonTextColor !== "string" || !colorPattern.test(stylingConfig.buttonTextColor) ||
    !PROMOTION_POSITIONS.some((value) => value === stylingConfig.position) ||
    !PROMOTION_SIZES.some((value) => value === stylingConfig.size) ||
    typeof stylingConfig.backdropClose !== "boolean"
  ) return null;
  if (!Number.isInteger(row.priority) || typeof row.is_primary !== "boolean") return null;

  const imageUrl = typeof row.image_url === "string" && isPublicStorageUrl(row.image_url, "promotion-assets")
    ? row.image_url
    : null;
  const primaryButtonUrl = typeof row.primary_button_url === "string" && row.primary_button_url.trim() && isSafePromotionUrl(row.primary_button_url)
    ? row.primary_button_url
    : null;
  const secondaryButtonUrl = typeof row.secondary_button_url === "string" && row.secondary_button_url.trim() && isSafePromotionUrl(row.secondary_button_url)
    ? row.secondary_button_url
    : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl,
    imageAlt: imageUrl && typeof row.image_alt === "string" ? row.image_alt : null,
    primaryButtonText: primaryButtonUrl && typeof row.primary_button_text === "string" ? row.primary_button_text : null,
    primaryButtonUrl,
    secondaryButtonText: secondaryButtonUrl && typeof row.secondary_button_text === "string" ? row.secondary_button_text : null,
    secondaryButtonUrl,
    stylingConfig,
    displayConfig,
    frequency: row.frequency as PromotionPopupPublic["frequency"],
    audience: row.audience as PromotionPopupPublic["audience"],
    priority: row.priority as number,
    isPrimary: row.is_primary,
  };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return noStoreJson({ popup: null, authenticated: false });

  const rawPath = request.nextUrl.searchParams.get("path") ?? "/";
  if (rawPath.length > 300 || !rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return noStoreJson({ popup: null, authenticated: false }, 400);
  }
  const pathname = normalizePopupPath(rawPath);
  if (isPromotionPopupExcluded(pathname)) return noStoreJson({ popup: null, authenticated: false });

  try {
    const user = await getOptionalUser();
    const db = await createSupabaseServerClient();
    const { data, error } = await db
      .from("promotional_popups")
      .select(
        "id, title, description, image_url, image_alt, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, styling_config, display_config, frequency, audience, priority, is_primary",
      )
      .order("priority", { ascending: false })
      .order("is_primary", { ascending: false })
      .order("id", { ascending: true });
    if (error) {
      console.error("[promotional-popup] public configuration read failed", error.message);
      return noStoreJson({ popup: null, authenticated: Boolean(user) });
    }

    const popup = (data ?? [])
      .map((row) => asPublicPopup(row as unknown as Record<string, unknown>))
      .filter((row): row is PromotionPopupPublic => Boolean(row))
      .find((row) =>
        isPromotionAudienceMatch(row.audience, Boolean(user)) &&
        isPromotionTargetMatch(row.displayConfig, pathname),
      );

    if (!popup) return noStoreJson({ popup: null, authenticated: Boolean(user) });

    let alreadyViewed = false;
    if (popup.frequency === "once_per_user" && user) {
      const { data: view, error: viewError } = await db
        .from("promotional_popup_user_views")
        .select("popup_id")
        .eq("popup_id", popup.id)
        .eq("user_id", user.id)
        .maybeSingle();
      // Fail closed if the persistence table is not ready or temporarily unavailable.
      alreadyViewed = Boolean(view) || Boolean(viewError);
    }

    return noStoreJson({ popup, alreadyViewed, authenticated: Boolean(user) });
  } catch (error) {
    console.error("[promotional-popup] request failed", error instanceof Error ? error.message : "unknown error");
    return noStoreJson({ popup: null, authenticated: false });
  }
}

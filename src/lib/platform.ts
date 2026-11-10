import "server-only";

import { cache } from "react";

import { hasServiceRole, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Public platform presentation settings. No secrets live here; the table only
 * stores values an administrator edits in /admin/settings. Reads use the
 * service role so the marketing shell renders even while the anon policies are
 * being deployed, and fall back to the built-in LearnCode identity.
 */
export type PlatformSettings = {
  platformName: string;
  shortDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  defaultLanguage: "id" | "en";
  certificateSignature: string;
  defaultPassingScore: number;
  contactEmail: string | null;
  contactUrl: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  source: "database" | "defaults";
};

export const PLATFORM_DEFAULTS: PlatformSettings = {
  platformName: "LearnCode",
  shortDescription: "Belajar HTML, CSS, dan JavaScript dengan praktik nyata dan AI Tutor.",
  logoUrl: null,
  faviconUrl: null,
  defaultLanguage: "id",
  certificateSignature: "Tim LearnCode",
  defaultPassingScore: 80,
  contactEmail: null,
  contactUrl: null,
  maintenanceMode: false,
  maintenanceMessage: "",
  source: "defaults",
};

export const getPlatformSettings = cache(async (): Promise<PlatformSettings> => {
  if (!isSupabaseConfigured() || !hasServiceRole()) return PLATFORM_DEFAULTS;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("platform_settings")
      .select(
        "platform_name, short_description, logo_url, favicon_url, default_language, certificate_signature, default_passing_score, contact_email, contact_url, maintenance_mode, maintenance_message",
      )
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("[platform] settings lookup failed", error.message);
      return PLATFORM_DEFAULTS;
    }

    return {
      platformName: (data.platform_name as string) || PLATFORM_DEFAULTS.platformName,
      shortDescription: (data.short_description as string) ?? "",
      logoUrl: (data.logo_url as string | null) ?? null,
      faviconUrl: (data.favicon_url as string | null) ?? null,
      defaultLanguage: data.default_language === "en" ? "en" : "id",
      certificateSignature:
        (data.certificate_signature as string) || PLATFORM_DEFAULTS.certificateSignature,
      defaultPassingScore:
        typeof data.default_passing_score === "number" ? data.default_passing_score : 80,
      contactEmail: (data.contact_email as string | null) ?? null,
      contactUrl: (data.contact_url as string | null) ?? null,
      maintenanceMode: Boolean(data.maintenance_mode),
      maintenanceMessage: (data.maintenance_message as string) ?? "",
      source: "database",
    };
  } catch (error) {
    console.error(
      "[platform] settings unavailable, using defaults",
      error instanceof Error ? error.message : error,
    );
    return PLATFORM_DEFAULTS;
  }
});

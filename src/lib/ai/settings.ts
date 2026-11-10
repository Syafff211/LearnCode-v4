import "server-only";

import { cache } from "react";

import { hasServiceRole, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AI_DAILY_MESSAGE_LIMIT, type AiAction } from "@/lib/validation/ai";
import {
  AI_FEATURE_KEYS,
  isAllowedGroqModel,
  type AiFeatureKey,
} from "@/lib/ai/features";

/**
 * Safe, non-secret AI Tutor settings.
 *
 * The Groq API key is never stored in the database: it lives only in the
 * server environment (GROQ_API_KEY on Vercel). This module reads the editable
 * behaviour settings that admins manage and falls back to environment defaults
 * if the table cannot be reached, so a database hiccup never silently unlocks
 * the tutor.
 */

export {
  AI_FEATURE_KEYS,
  AI_FEATURE_LABELS,
  GROQ_ALLOWED_MODELS,
  GROQ_MODEL_LABELS,
  isAllowedGroqModel,
} from "@/lib/ai/features";
export type { AiFeatureKey, GroqAllowedModel } from "@/lib/ai/features";

export type AiSettings = {
  enabled: boolean;
  dailyMessageLimit: number;
  maxInputChars: number;
  maxOutputTokens: number;
  model: string;
  features: AiFeatureKey[];
  learningInstructions: string;
  source: "database" | "defaults";
};

const DEFAULT_FEATURES: AiFeatureKey[] = [...AI_FEATURE_KEYS];

function normalizeFeatures(value: unknown): AiFeatureKey[] {
  if (!Array.isArray(value)) return DEFAULT_FEATURES;
  const allowed = value.filter(
    (item): item is AiFeatureKey =>
      typeof item === "string" && (AI_FEATURE_KEYS as readonly string[]).includes(item),
  );
  return allowed.length > 0 ? Array.from(new Set(allowed)) : DEFAULT_FEATURES;
}

export const getAiSettings = cache(async (): Promise<AiSettings> => {
  const fallback: AiSettings = {
    enabled: true,
    dailyMessageLimit: AI_DAILY_MESSAGE_LIMIT,
    maxInputChars: 4000,
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 1200) || 1200,
    model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
    features: DEFAULT_FEATURES,
    learningInstructions: "",
    source: "defaults",
  };

  if (!isSupabaseConfigured() || !hasServiceRole()) return fallback;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("ai_settings")
      .select(
        "enabled, daily_message_limit, max_input_chars, max_output_tokens, model, features, learning_instructions",
      )
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error("[ai] settings lookup failed", error.message);
      return fallback;
    }

    return {
      enabled: Boolean(data.enabled),
      dailyMessageLimit: Number(data.daily_message_limit) || fallback.dailyMessageLimit,
      maxInputChars: Number(data.max_input_chars) || fallback.maxInputChars,
      maxOutputTokens: Number(data.max_output_tokens) || fallback.maxOutputTokens,
      model: isAllowedGroqModel(String(data.model)) ? String(data.model) : fallback.model,
      features: normalizeFeatures(data.features),
      learningInstructions:
        typeof data.learning_instructions === "string" ? data.learning_instructions : "",
      source: "database",
    };
  } catch (error) {
    console.error(
      "[ai] settings unavailable, using defaults",
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
});

/** Maps an AI action to the feature toggle that can switch it off. */
export function aiActionFeature(action: AiAction): AiFeatureKey {
  switch (action) {
    case "explain_code":
    case "explain_lesson":
      return "explain";
    case "debug_code":
      return "debug";
    case "hint":
      return "hint";
    case "code_review":
      return "review";
    default:
      return "general";
  }
}

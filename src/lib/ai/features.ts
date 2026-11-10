/**
 * Client-safe AI option lists. No DB access and no secrets: just the feature
 * keys and Groq models the platform is configured to support. The server-side
 * settings loader in `settings.ts` validates stored values against these.
 */
export const AI_FEATURE_KEYS = ["general", "explain", "debug", "hint", "review"] as const;
export type AiFeatureKey = (typeof AI_FEATURE_KEYS)[number];

export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  general: "Tanya jawab umum & saran latihan",
  explain: "Menjelaskan kode & lesson",
  debug: "Membantu debug kode",
  hint: "Memberi hint tanpa jawaban penuh",
  review: "Review kode",
};

export const GROQ_ALLOWED_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"] as const;
export type GroqAllowedModel = (typeof GROQ_ALLOWED_MODELS)[number];

export const GROQ_MODEL_LABELS: Record<GroqAllowedModel, string> = {
  "openai/gpt-oss-120b": "GPT-OSS 120B — kualitas terbaik",
  "openai/gpt-oss-20b": "GPT-OSS 20B — lebih cepat dan murah",
};

export function isAllowedGroqModel(value: string): value is GroqAllowedModel {
  return (GROQ_ALLOWED_MODELS as readonly string[]).includes(value);
}

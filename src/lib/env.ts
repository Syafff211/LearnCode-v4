import { z } from "zod";

/**
 * Environment handling.
 *
 * Public variables are referenced with literal `process.env.NEXT_PUBLIC_*`
 * expressions so the Next.js compiler can inline them in client bundles.
 * Server-only secrets are never imported by client components.
 *
 * All values are treated as optional so that `next build` succeeds in a clean
 * checkout. Features that require missing configuration fail with an explicit,
 * user-facing setup message instead of crashing the whole site.
 */

export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .trim()
    .url("NEXT_PUBLIC_APP_URL harus berupa URL valid")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .trim()
    .url("NEXT_PUBLIC_SUPABASE_URL harus berupa URL valid")
    .optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .trim()
    .min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY tidak valid")
    .optional(),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .trim()
    .min(20, "SUPABASE_SERVICE_ROLE_KEY tidak valid")
    .optional(),
  GROQ_API_KEY: z.string().trim().min(10, "GROQ_API_KEY tidak valid").optional(),
  GROQ_MODEL: z.string().trim().min(1).default(DEFAULT_GROQ_MODEL),
  AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(128).max(4096).default(1200),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(5000).max(120_000).default(45_000),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function emptyToUndefined(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function parsePublicEnv(
  source: Record<string, string | undefined>,
): { success: true; data: PublicEnv } | { success: false; error: string } {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: emptyToUndefined(source.NEXT_PUBLIC_APP_URL),
    NEXT_PUBLIC_SUPABASE_URL: emptyToUndefined(source.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: emptyToUndefined(source.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }
  return { success: true, data: parsed.data };
}

export function parseServerEnv(
  source: Record<string, string | undefined>,
): { success: true; data: ServerEnv } | { success: false; error: string } {
  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: emptyToUndefined(source.SUPABASE_SERVICE_ROLE_KEY),
    GROQ_API_KEY: emptyToUndefined(source.GROQ_API_KEY),
    GROQ_MODEL: emptyToUndefined(source.GROQ_MODEL),
    AI_MAX_OUTPUT_TOKENS: emptyToUndefined(source.AI_MAX_OUTPUT_TOKENS),
    AI_REQUEST_TIMEOUT_MS: emptyToUndefined(source.AI_REQUEST_TIMEOUT_MS),
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join("; "),
    };
  }
  return { success: true, data: parsed.data };
}

export function getPublicEnv(): PublicEnv {
  const result = parsePublicEnv({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    throw new Error(`Konfigurasi environment tidak valid: ${result.error}`);
  }
  return result.data;
}

export function getServerEnv(): ServerEnv {
  const result = parseServerEnv({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
    AI_MAX_OUTPUT_TOKENS: process.env.AI_MAX_OUTPUT_TOKENS,
    AI_REQUEST_TIMEOUT_MS: process.env.AI_REQUEST_TIMEOUT_MS,
  });
  if (!result.success) {
    throw new Error(`Konfigurasi environment tidak valid: ${result.error}`);
  }
  return result.data;
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  try {
    new URL(url);
  } catch {
    return null;
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getGroqConfig(): {
  apiKey: string;
  model: string;
  maxOutputTokens: number;
  timeoutMs: number;
} | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  const env = getServerEnv();
  return {
    apiKey,
    model: env.GROQ_MODEL,
    maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
    timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
  };
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/** Mask secrets before they can ever reach a log line. */
export function redactSecret(value: string | undefined): string {
  if (!value) return "(unset)";
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}…${value.slice(-2)}`;
}

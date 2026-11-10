import "server-only";

import type { ZodError } from "zod";

import { AdminAccessError } from "@/lib/admin/auth";
import { adminActionLimiter, adminSensitiveLimiter } from "@/lib/rate-limit";
import type { AdminActionState } from "@/lib/actions/admin-state";

export type { AdminActionState } from "@/lib/actions/admin-state";
export { IDLE_ADMIN_STATE } from "@/lib/actions/admin-state";

export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    map[key] = [...(map[key] ?? []), issue.message];
  }
  return map;
}

export function adminErrorState(error: unknown): AdminActionState {
  if (error instanceof AdminAccessError) {
    return { status: "error", message: error.message };
  }
  if (isUniqueViolation(error)) {
    return {
      status: "error",
      message: "Slug atau judul sudah dipakai. Pilih nilai unik lain.",
    };
  }
  console.error("[admin] action failed", error instanceof Error ? error.message : error);
  return {
    status: "error",
    message: "Perubahan belum bisa disimpan. Coba lagi beberapa saat.",
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "23505";
}

/**
 * Per-admin mutation limiter. Every action calls this after authorization, so
 * two admins cannot exhaust each other's budget.
 */
export function checkAdminRateLimit(
  userId: string,
  options: { sensitive?: boolean } = {},
): AdminActionState | null {
  const limiter = options.sensitive ? adminSensitiveLimiter : adminActionLimiter;
  const result = limiter.check(`admin:${userId}`);
  if (result.allowed) return null;
  return {
    status: "error",
    message: `Terlalu banyak aksi admin dalam waktu singkat. Coba lagi dalam ${result.retryAfterSeconds} detik.`,
  };
}

export function requiredString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

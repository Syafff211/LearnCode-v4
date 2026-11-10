import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminContext } from "@/lib/admin/auth";

/**
 * Append-only audit trail for administrative actions.
 *
 * Rows are written with the service role, after the action's own authorization
 * and validation succeed. `admin_audit_logs` has a database trigger that rejects
 * updates and deletes, and RLS exposes it read-only to admins.
 */

const SECRET_KEY_PATTERN = /pass(word)?|secret|token|api[_-]?key|authorization|cookie|credential/i;

export type AuditAction =
  | "course.created"
  | "course.updated"
  | "course.status_changed"
  | "course.deleted"
  | "lesson.created"
  | "lesson.updated"
  | "lesson.status_changed"
  | "lesson.reordered"
  | "lesson.deleted"
  | "quiz.created"
  | "quiz.updated"
  | "question.created"
  | "question.updated"
  | "question.deleted"
  | "question.reordered"
  | "user.suspended"
  | "user.reactivated"
  | "certificate.revoked"
  | "ai_settings.updated"
  | "platform_settings.updated"
  | "blog_post.created"
  | "blog_post.updated"
  | "blog_post.status_changed"
  | "blog_post.deleted"
  | "promotion_popup.created"
  | "promotion_popup.updated"
  | "promotion_popup.status_changed"
  | "promotion_popup.deleted";

export type AuditTarget = "course" | "lesson" | "quiz" | "question" | "user" | "certificate" | "settings" | "blog_post" | "promotion_popup";

export function sanitizeMetadata(metadata: Record<string, unknown> = {}): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SECRET_KEY_PATTERN.test(key)) {
      clean[key] = "[redacted]";
      continue;
    }
    if (value === null || value === undefined) continue;
    if (typeof value === "string") {
      clean[key] = value.slice(0, 400);
    } else if (typeof value === "number" || typeof value === "boolean") {
      clean[key] = value;
    } else if (Array.isArray(value)) {
      clean[key] = value.slice(0, 20).map((item) =>
        typeof item === "string" ? item.slice(0, 200) : typeof item === "number" ? item : String(item).slice(0, 200),
      );
    } else {
      clean[key] = JSON.stringify(value).slice(0, 800);
    }
  }
  return clean;
}

export async function recordAdminAudit(
  context: Pick<AdminContext, "user">,
  entry: {
    action: AuditAction;
    targetType: AuditTarget;
    targetId?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<boolean> {
  try {
    const db = createSupabaseAdminClient();
    const { error } = await db.from("admin_audit_logs").insert({
      actor_user_id: context.user.id,
      actor_email: context.user.email ?? "",
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId ?? null,
      reason: entry.reason?.slice(0, 500) ?? null,
      metadata: sanitizeMetadata(entry.metadata),
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    // The user-facing action already succeeded; surface the gap in server logs.
    console.error(
      "[admin] audit log write failed",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

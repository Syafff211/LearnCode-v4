import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import {
  getProfile,
  getSessionContext,
  isAdminProfile,
  type Profile,
} from "@/lib/auth";
import { hasServiceRole, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side admin authorization.
 *
 * This is the only place that decides whether a request may act as an admin:
 *  1. Supabase Auth validates the session JWT against the auth server.
 *  2. The role is read from public.profiles (never from cookies, headers, or the
 *     request body) and the account must not be suspended.
 *  3. Only then is a service-role client handed to admin code. Nothing here is
 *     callable from the browser; the service-role key stays on the server.
 */

export type AdminContext = {
  user: User;
  profile: Profile;
  /** Service-role client for admin reads/writes. Never send to the browser. */
  db: SupabaseClient;
};

export type AdminAuthState =
  | { status: "ok"; context: AdminContext }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export class AdminAccessError extends Error {
  readonly code: "unauthenticated" | "forbidden" | "unavailable";

  constructor(code: AdminAccessError["code"], message: string) {
    super(message);
    this.name = "AdminAccessError";
    this.code = code;
  }
}

export const getAdminAuthState = cache(async (): Promise<AdminAuthState> => {
  if (!isSupabaseConfigured() || !hasServiceRole()) {
    return { status: "unavailable" };
  }

  const session = await getSessionContext();
  if (!session) return { status: "unauthenticated" };

  const profile = await getProfile(session.user.id);
  if (!isAdminProfile(profile)) return { status: "forbidden" };

  let db: SupabaseClient;
  try {
    db = createSupabaseAdminClient();
  } catch {
    return { status: "unavailable" };
  }

  return { status: "ok", context: { user: session.user, profile: profile as Profile, db } };
});

/** For pages: redirects instead of rendering admin data for the wrong caller. */
export async function requireAdminPage(nextPath: string): Promise<AdminContext> {
  const state = await getAdminAuthState();
  if (state.status === "ok") return state.context;
  if (state.status === "unauthenticated") {
    redirect(`/admin?next=${encodeURIComponent(nextPath)}`);
  }
  if (state.status === "forbidden") {
    redirect("/admin?denied=1");
  }
  redirect("/admin?status=unavailable");
}

/** For Server Actions: throws, so each action can return a typed error state. */
export async function requireAdminAction(): Promise<AdminContext> {
  const state = await getAdminAuthState();
  if (state.status === "ok") return state.context;
  if (state.status === "unauthenticated") {
    throw new AdminAccessError("unauthenticated", "Sesi admin berakhir. Silakan masuk lagi.");
  }
  if (state.status === "forbidden") {
    throw new AdminAccessError("forbidden", "Akun ini tidak memiliki akses admin.");
  }
  throw new AdminAccessError(
    "unavailable",
    "Panel admin belum siap: konfigurasi Supabase atau service role belum lengkap.",
  );
}

/** Counts admins so the UI can warn before removing the last one. */
export async function countActiveAdmins(db: SupabaseClient): Promise<number> {
  const { count, error } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .is("suspended_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

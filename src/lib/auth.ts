import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: "user" | "admin";
  suspended_at: string | null;
  preferred_language: "id" | "en";
  theme: "light" | "dark" | "system";
  created_at: string;
  updated_at: string;
};

export type SessionContext = {
  user: User;
  supabase: SupabaseClient;
};

/**
 * Verifies the current session against Supabase Auth (not just the cookie) and
 * returns the user. `getUser()` performs a network call to validate the JWT,
 * which is what we want for authorization decisions.
 */
export async function getOptionalUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { user: data.user, supabase };
  } catch {
    return null;
  }
});

export async function requireSession(nextPath: string): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) {
    const next = encodeURIComponent(nextPath);
    redirect(`/login?next=${next}`);
  }
  return session;
}

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, avatar_url, role, preferred_language, theme, created_at, updated_at, suspended_at",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
});

export async function requireProfile(nextPath: string): Promise<{
  user: User;
  supabase: SupabaseClient;
  profile: Profile;
}> {
  const { user, supabase } = await requireSession(nextPath);
  const profile = await getProfile(user.id);
  if (!profile) {
    // The auth trigger should always create a profile. If it is missing, fail
    // safely with a readable error instead of silently continuing.
    redirect("/login?error=profile_missing");
  }
  if (profile.suspended_at) {
    // Admin-disabled accounts keep their data but lose access immediately.
    // A dedicated page avoids a /login <-> /dashboard redirect loop with the
    // session-refresh proxy.
    redirect("/account-suspended");
  }
  return { user, supabase, profile };
}

export function displayName(user: User, profile: Profile | null): string {
  const name = profile?.full_name?.trim();
  if (name) return name;
  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  if (metadataName) return metadataName;
  return user.email?.split("@")[0] ?? "Pelajar";
}

export function profileLanguage(profile: Profile | null): "id" | "en" {
  return profile?.preferred_language === "en" ? "en" : "id";
}

/** True only for a database-verified admin account that is not suspended. */
export function isAdminProfile(profile: Profile | null): boolean {
  return Boolean(profile && profile.role === "admin" && !profile.suspended_at);
}

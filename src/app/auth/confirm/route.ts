import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Handles token_hash links from Supabase email templates.
 *
 * Recommended template (Authentication → Email Templates):
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
 * For recovery:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 *
 * The default Supabase templates that point at {{ .ConfirmationURL }} also work
 * because Supabase redirects to /auth/callback with a code parameter.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const typeParam = url.searchParams.get("type");
  const next = safeRedirectPath(
    url.searchParams.get("next"),
    typeParam === "recovery" ? "/reset-password" : "/dashboard",
  );

  if (!tokenHash || !typeParam || !ALLOWED_TYPES.includes(typeParam as EmailOtpType)) {
    return NextResponse.redirect(
      new URL("/login?error=auth_callback", url.origin),
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: typeParam as EmailOtpType,
    });

    if (error) {
      console.error("[auth] verifyOtp failed", error.message);
      return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
    }

    return NextResponse.redirect(new URL(next, url.origin));
  } catch (error) {
    console.error("[auth] confirm route failed", error instanceof Error ? error.message : error);
    return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));
  }
}

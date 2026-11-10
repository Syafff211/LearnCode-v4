import { getAppUrl } from "@/lib/env";
import { safeRedirectPath } from "@/lib/utils";

/** Build the canonical same-origin PKCE callback used by email and OAuth flows. */
export function getAuthCallbackUrl(next?: string | null): string {
  const callback = new URL("/auth/callback", getAppUrl());
  callback.searchParams.set("next", safeRedirectPath(next, "/dashboard"));
  return callback.toString();
}

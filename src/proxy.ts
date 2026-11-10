import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/env";

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return true;
  if (pathname.startsWith("/learn/")) return true;
  if (pathname === "/playground") return true;
  if (pathname === "/ai-tutor") return true;
  if (pathname === "/settings") return true;
  if (pathname.startsWith("/certificates/")) return true;
  if (pathname.endsWith("/quiz") || pathname.endsWith("/complete")) {
    return pathname.startsWith("/courses/");
  }
  return false;
}

/**
 * Network boundary: refresh the Supabase session cookie on navigation and do a
 * fast redirect for protected pages. This is NOT the authorization boundary —
 * every page and route handler re-verifies the session server-side.
 */
export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();
  const pathname = request.nextUrl.pathname;

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const normalized = pathname.replace(/\/+$/, "") || "/";
  const isAdminLogin = normalized === "/admin";
  const isAdminArea = normalized.startsWith("/admin/");

  // Admin pages: unauthenticated visitors are sent to the admin sign-in page.
  // Role checks still happen in the layout, every page and every action.
  if (!userId && isAdminArea) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  // Signed-in admins never need the admin sign-in form. Students stay on it and
  // receive the access-denied explanation instead of a redirect loop.
  if (userId && isAdminLogin) {
    const { data } = await supabase
      .from("profiles")
      .select("role, suspended_at")
      .eq("id", userId)
      .maybeSingle();
    if (data?.role === "admin" && !data.suspended_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (!userId && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (userId && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on pages only. API routes and static assets handle their own
     * concerns; auth cookies are refreshed by the server clients there.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|monaco|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};

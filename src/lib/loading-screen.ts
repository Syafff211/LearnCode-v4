/**
 * Shared constants and pure route-gating rules for LearnCode's
 * GlobalLoadingScreen.
 *
 * Asset: `public/loading.gif` (`/loading.gif`).
 * Kept free of DOM/React dependencies so navigation gating rules can be unit tested.
 */

export const LOADING_GIF_SRC = "/loading.gif";
export const LOADING_GIF_SIZE = 420;

/**
 * Reveal delay so fast or prefetched transitions never flicker.
 */
export const DEFAULT_LOADING_DELAY_MS = 150;

/**
 * Fade-out duration for the managed loading overlay after navigation commits.
 */
export const DEFAULT_LOADING_FADE_MS = 180;

/**
 * Fail-safe circuit breaker if a client navigation stalls due to a network drop
 * or aborted server response so the overlay never locks the page indefinitely.
 */
export const DEFAULT_LOADING_SAFETY_TIMEOUT_MS = 12_000;

export type LoadingMediaKind = "gif" | "fallback";

const NON_PAGE_PATH_PREFIXES = ["/api/", "/auth/"];

export function normalizePathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "") || "/";
}

export type RouteTransitionInput = {
  href: string | null | undefined;
  currentPathname: string;
  origin: string;
};

/**
 * Resolves the normalized target pathname when a route transition should
 * trigger `GlobalLoadingScreen`, or returns `null` when it should not:
 * - external origins, non-http schemes (`mailto:`, `tel:`, `javascript:`, etc.)
 * - API & auth handler endpoints (`/api/*`, `/auth/*`)
 * - hash-only jumps (`#section`) or query-only updates on the same pathname
 * - same-route transitions where pathname did not change
 */
export function resolveTransitionPathname(
  input: RouteTransitionInput,
): string | null {
  const rawHref = input.href?.trim();
  if (!rawHref || rawHref.startsWith("#")) return null;
  if (/^(mailto:|tel:|javascript:|data:|blob:)/i.test(rawHref)) return null;

  let currentUrl: URL;
  let nextUrl: URL;
  try {
    currentUrl = new URL(normalizePathname(input.currentPathname), input.origin);
    nextUrl = new URL(rawHref, currentUrl);
  } catch {
    return null;
  }

  if (nextUrl.origin !== currentUrl.origin) return null;

  const nextPath = normalizePathname(nextUrl.pathname);
  if (
    NON_PAGE_PATH_PREFIXES.some(
      (prefix) => nextPath === prefix.slice(0, -1) || nextPath.startsWith(prefix),
    )
  ) {
    return null;
  }

  const currentPath = normalizePathname(currentUrl.pathname);
  return nextPath !== currentPath ? nextPath : null;
}

export type NavigationClickInput = {
  href: string | null | undefined;
  currentHref: string;
  origin: string;
  target?: string | null;
  download?: boolean;
  defaultPrevented?: boolean;
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export function shouldShowNavigationLoading(input: NavigationClickInput): boolean {
  if (input.defaultPrevented) return false;
  if (typeof input.button === "number" && input.button !== 0) return false;
  if (input.metaKey || input.ctrlKey || input.shiftKey || input.altKey) {
    return false;
  }
  if (input.download) return false;

  const target = input.target?.trim().toLowerCase();
  if (target && target !== "_self") return false;

  let currentPathname = "/";
  try {
    currentPathname = new URL(input.currentHref, input.origin).pathname;
  } catch {
    return false;
  }

  return (
    resolveTransitionPathname({
      href: input.href,
      currentPathname,
      origin: input.origin,
    }) !== null
  );
}

export function isNavigationErrorAbort(message: string | undefined): boolean {
  if (!message) return false;
  return /ChunkLoadError|Loading chunk|Failed to fetch|NetworkError|Load failed|cancelled/i.test(
    message,
  );
}

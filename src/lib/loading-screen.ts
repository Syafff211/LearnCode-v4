/**
 * Shared constants and pure rules for the LearnCode loading screen.
 *
 * Asset priority:
 * 1. `public/loading.mp4` (`/loading.mp4`)
 * 2. `public/loading.gif` (`/loading.gif`)
 *
 * Kept free of DOM/React dependencies so media fallback and navigation gating
 * rules can be thoroughly unit tested.
 */

export const LOADING_VIDEO_SRC = "/loading.mp4";
export const LOADING_GIF_SRC = "/loading.gif";
export const LOADING_SCREEN_BACKGROUND = "#FAF9F5";

/**
 * Delay before revealing the full-screen loading overlay so fast transitions
 * or already-cached responses never flash or blink.
 */
export const DEFAULT_LOADING_DELAY_MS = 150;

/**
 * Upper bound for client-tracked loading states (initial resource load or
 * client navigation) so network stalls or aborted requests cannot trap users.
 */
export const DEFAULT_LOADING_SAFETY_TIMEOUT_MS = 15_000;

export type LoadingMediaKind = "video" | "gif" | "none";

export function getLoadingMediaSource(
  kind: LoadingMediaKind,
  {
    videoSrc = LOADING_VIDEO_SRC,
    gifSrc = LOADING_GIF_SRC,
  }: { videoSrc?: string; gifSrc?: string } = {},
): string | null {
  if (kind === "video") return videoSrc;
  if (kind === "gif") return gifSrc;
  return null;
}

export function getNextLoadingMediaFallback(
  current: LoadingMediaKind,
): LoadingMediaKind {
  if (current === "video") return "gif";
  return "none";
}

export function isDocumentReady(
  readyState: DocumentReadyState | string | undefined,
): boolean {
  return readyState === "complete";
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

const NON_PAGE_PATH_PREFIXES = ["/api/", "/auth/"];

/**
 * Determines whether clicking an anchor should trigger a navigation loading
 * indicator. Ignores modified clicks, external origins, downloads, hash-only
 * jumps, API/auth download endpoints, and links to the current route.
 */
export function shouldShowNavigationLoading(input: NavigationClickInput): boolean {
  if (input.defaultPrevented) return false;
  if (typeof input.button === "number" && input.button !== 0) return false;
  if (input.metaKey || input.ctrlKey || input.shiftKey || input.altKey) {
    return false;
  }
  if (input.download) return false;

  const target = input.target?.trim().toLowerCase();
  if (target && target !== "_self") return false;

  const rawHref = input.href?.trim();
  if (!rawHref || rawHref.startsWith("#")) return false;
  if (/^(mailto:|tel:|javascript:|data:|blob:)/i.test(rawHref)) return false;

  let nextUrl: URL;
  let currentUrl: URL;
  try {
    currentUrl = new URL(input.currentHref, input.origin);
    nextUrl = new URL(rawHref, currentUrl);
  } catch {
    return false;
  }

  if (nextUrl.origin !== currentUrl.origin) return false;
  if (
    NON_PAGE_PATH_PREFIXES.some(
      (prefix) =>
        nextUrl.pathname === prefix.slice(0, -1) ||
        nextUrl.pathname.startsWith(prefix),
    )
  ) {
    return false;
  }

  const nextRoute = `${nextUrl.pathname}${nextUrl.search}`;
  const currentRoute = `${currentUrl.pathname}${currentUrl.search}`;
  return nextRoute !== currentRoute;
}

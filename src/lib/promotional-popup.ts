export const PROMOTION_FREQUENCIES = [
  "every_reload",
  "once_per_session",
  "once_per_day",
  "once_per_user",
  "every_visit",
] as const;
export type PromotionFrequency = (typeof PROMOTION_FREQUENCIES)[number];

export const PROMOTION_AUDIENCES = ["all", "guest", "authenticated"] as const;
export type PromotionAudience = (typeof PROMOTION_AUDIENCES)[number];

export const PROMOTION_TYPES = ["promotion", "announcement", "information", "custom"] as const;
export type PromotionType = (typeof PROMOTION_TYPES)[number];

export const PROMOTION_PAGE_TARGETS = [
  "homepage",
  "courses",
  "lessons",
  "blog",
  "dashboard",
  "playground",
  "ai_tutor",
  "all_public",
  "all_user",
  "custom",
] as const;
export type PromotionPageTarget = (typeof PROMOTION_PAGE_TARGETS)[number];

export const PROMOTION_POSITIONS = ["center", "bottom_right", "bottom_left"] as const;
export type PromotionPosition = (typeof PROMOTION_POSITIONS)[number];

export const PROMOTION_SIZES = ["compact", "normal", "wide"] as const;
export type PromotionSize = (typeof PROMOTION_SIZES)[number];

export type PromotionStyleConfig = {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  position: PromotionPosition;
  size: PromotionSize;
  backdropClose: boolean;
};

export type PromotionDisplayConfig = {
  pageTargets: PromotionPageTarget[];
  customPaths: string[];
};

export type PromotionPopupPublic = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string | null;
  primaryButtonText: string | null;
  primaryButtonUrl: string | null;
  secondaryButtonText: string | null;
  secondaryButtonUrl: string | null;
  stylingConfig: PromotionStyleConfig;
  displayConfig: PromotionDisplayConfig;
  frequency: PromotionFrequency;
  audience: PromotionAudience;
  priority: number;
  isPrimary: boolean;
};

export type PromotionPopupAdmin = PromotionPopupPublic & {
  internalName: string;
  imagePath: string | null;
  popupType: PromotionType;
  isActive: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_PROMOTION_STYLE: PromotionStyleConfig = {
  backgroundColor: "#faf9f5",
  textColor: "#25251f",
  buttonColor: "#a8d35b",
  buttonTextColor: "#1a2012",
  position: "center",
  size: "normal",
  backdropClose: true,
};

export const DEFAULT_PROMOTION_DISPLAY: PromotionDisplayConfig = {
  pageTargets: ["all_public", "all_user"],
  customPaths: [],
};

const EXCLUDED_ROUTES = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/verify",
  "/certificate-verification",
  "/account-suspended",
] as const;

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function normalizePopupPath(pathname: string): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return "/";
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  return withoutQuery.length > 1 ? withoutQuery.replace(/\/+$/, "") : withoutQuery;
}

export function isPromotionPopupExcluded(pathname: string): boolean {
  const normalized = normalizePopupPath(pathname);
  return EXCLUDED_ROUTES.some((route) => matchesRoute(normalized, route));
}

function matchesCustomPath(pathname: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2).replace(/\/+$/, "");
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return pathname === pattern;
}

export function isPromotionTargetMatch(
  config: PromotionDisplayConfig,
  rawPathname: string,
): boolean {
  const pathname = normalizePopupPath(rawPathname);
  if (isPromotionPopupExcluded(pathname)) return false;

  return config.pageTargets.some((target) => {
    switch (target) {
      case "homepage":
        return pathname === "/";
      case "courses":
        return matchesRoute(pathname, "/courses");
      case "lessons":
        return matchesRoute(pathname, "/learn");
      case "blog":
        return matchesRoute(pathname, "/blog");
      case "dashboard":
        return matchesRoute(pathname, "/dashboard") || matchesRoute(pathname, "/settings");
      case "playground":
        return pathname === "/playground";
      case "ai_tutor":
        return pathname === "/ai-tutor";
      case "all_public":
        return pathname === "/" || matchesRoute(pathname, "/courses") || matchesRoute(pathname, "/blog");
      case "all_user":
        return (
          matchesRoute(pathname, "/dashboard") ||
          matchesRoute(pathname, "/settings") ||
          matchesRoute(pathname, "/learn") ||
          pathname === "/playground" ||
          pathname === "/ai-tutor"
        );
      case "custom":
        return config.customPaths.some((pattern) => matchesCustomPath(pathname, pattern));
      default:
        return false;
    }
  });
}

export function isPromotionAudienceMatch(
  audience: PromotionAudience,
  authenticated: boolean,
): boolean {
  if (audience === "all") return true;
  return audience === "authenticated" ? authenticated : !authenticated;
}

export type PromotionStatus = "active" | "inactive" | "scheduled" | "expired";

export function getPromotionStatus(
  popup: Pick<PromotionPopupAdmin, "isActive" | "startsAt" | "endsAt">,
  now = Date.now(),
): PromotionStatus {
  if (!popup.isActive) return "inactive";
  const start = new Date(popup.startsAt).getTime();
  if (Number.isFinite(start) && start > now) return "scheduled";
  const end = popup.endsAt ? new Date(popup.endsAt).getTime() : null;
  if (end !== null && Number.isFinite(end) && end <= now) return "expired";
  return "active";
}

export function isSafePromotionUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) return true;
  try {
    const url = new URL(trimmed);
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

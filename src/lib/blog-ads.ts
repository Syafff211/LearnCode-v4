export const HILLTOPADS_BLOG_ZONE_ID = "7655493";

export const HILLTOPADS_BLOG_SCRIPT_SRC =
  "//quarrelsomebitter.com/baXjVMsqd.GFlI0KYkWdcK/deImh9qu/ZrUJlckYP/TYc_2yNnTnU/0SOmTRMAtTNOzJYV1pN_T-Qv5yNtwv";

export const HILLTOPADS_REFERRER_POLICY = "no-referrer-when-downgrade" as const;

export type HilltopAdsScriptElement = HTMLScriptElement & {
  settings?: Record<string, unknown>;
};

export function normalizeBlogAdsPathname(
  pathname: string | null | undefined,
): string {
  if (!pathname) return "/";
  const withoutQuery = pathname.split(/[?#]/, 1)[0] || "/";
  if (!withoutQuery.startsWith("/")) return "/";
  return withoutQuery.length > 1
    ? withoutQuery.replace(/\/+$/, "")
    : withoutQuery;
}

/**
 * Only public `/blog` routes (`/blog`, `/blog/[slug]`, `/blog/category/[slug]`)
 * are eligible for HilltopAds. Admin (`/admin/blog`) and all other app/marketing
 * routes stay completely ad-free.
 */
export function isBlogAdsRoute(pathname: string | null | undefined): boolean {
  const normalized = normalizeBlogAdsPathname(pathname);
  return normalized === "/blog" || normalized.startsWith("/blog/");
}

export function createHilltopAdsScript(
  doc: Document,
  settings: Record<string, unknown> = {},
): HilltopAdsScriptElement {
  const script = doc.createElement("script") as HilltopAdsScriptElement;
  script.settings = settings;
  script.src = HILLTOPADS_BLOG_SCRIPT_SRC;
  script.async = true;
  script.referrerPolicy = HILLTOPADS_REFERRER_POLICY;
  script.dataset.hilltopadsZone = HILLTOPADS_BLOG_ZONE_ID;
  return script;
}

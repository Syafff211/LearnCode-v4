export const HILLTOPADS_BLOG_ZONE_ID = "7655493";

export const HILLTOPADS_BLOG_SCRIPT_SRC =
  "//quarrelsomebitter.com/baXjVMsqd.GFlI0KYkWdcK/deImh9qu/ZrUJlckYP/TYc_2yNnTnU/0SOmTRMAtTNOzJYV1pN_T-Qv5yNtwv";

export const HILLTOPADS_REFERRER_POLICY = "no-referrer-when-downgrade" as const;

export const HILLTOPADS_REFERRAL_URL =
  "https://hilltopads.com/id?ref=415472" as const;

export const HILLTOPADS_REFERRAL_BANNER_WIDTH = 728;
export const HILLTOPADS_REFERRAL_BANNER_HEIGHT = 90;

export type HilltopAdsReferralBanner = {
  id: string;
  label: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const HILLTOPADS_REFERRAL_BANNERS: readonly HilltopAdsReferralBanner[] = [
  {
    id: "huge_income",
    label: "Huge Income",
    src: "https://static.hilltopads.com/other/banners/pub/huge_income/728x90.gif?v=1795523369",
    alt: "HilltopAds — Dapatkan penghasilan maksimal dari trafik situs Anda",
    width: HILLTOPADS_REFERRAL_BANNER_WIDTH,
    height: HILLTOPADS_REFERRAL_BANNER_HEIGHT,
  },
  {
    id: "get_high_ecpm",
    label: "High eCPM & Profit",
    src: "https://static.hilltopads.com/other/banners/pub/get_high_ecpm/728x90.gif?v=1795523369",
    alt: "HilltopAds — Have good traffic? Get high eCPM and profit!",
    width: HILLTOPADS_REFERRAL_BANNER_WIDTH,
    height: HILLTOPADS_REFERRAL_BANNER_HEIGHT,
  },
  {
    id: "make_big_money",
    label: "Pembayaran Global",
    src: "https://static.hilltopads.com/other/banners/pub/make_big_money/728x90.gif?v=1795523369",
    alt: "HilltopAds — Pembayaran USDT, Bitcoin, PayPal, Paxum, Webmoney, dan Wire Transfer",
    width: HILLTOPADS_REFERRAL_BANNER_WIDTH,
    height: HILLTOPADS_REFERRAL_BANNER_HEIGHT,
  },
];

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

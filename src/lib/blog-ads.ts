export const HILLTOPADS_BLOG_ZONE_ID = "7655493";

export const HILLTOPADS_BLOG_SCRIPT_SRC =
  "//quarrelsomebitter.com/baXjVMsqd.GFlI0KYkWdcK/deImh9qu/ZrUJlckYP/TYc_2yNnTnU/0SOmTRMAtTNOzJYV1pN_T-Qv5yNtwv";

export const HILLTOPADS_POPUNDER_ZONE_ID = "7655861";

export const HILLTOPADS_POPUNDER_SCRIPT_SRC =
  "//faithfuloccasion.com/chDg9a6.bV2k5dlmSaW/Q/9HNKzxY/1/NHTTgc2/MBSn0-3tN/jpU/1HODDVY/1D";

export const HILLTOPADS_LEFT_BANNER_ZONE_ID = "7656005";

export const HILLTOPADS_LEFT_BANNER_SCRIPT_SRC =
  "//quarrelsomebitter.com/b.XhVvs/d/Grl/0yYCWKcj/xe/mJ9-ulZhUVlnkZPaTvcm2/NsTuYkwjMXDUUctxNkz/YW1nN/jcAGwOO_QD";

export const HILLTOPADS_RIGHT_BANNER_ZONE_ID = "7656021";

export const HILLTOPADS_RIGHT_BANNER_SCRIPT_SRC =
  "//quarrelsomebitter.com/b.XyV/s/d/GQla0tY/W/cz/EelmU9quiZ/UOlrkFPcTzc/2iNvT/YOwwM_j/Elt/N_zzYM1UNEjgAryJNRQY";

export const HILLTOPADS_SIDE_RAIL_MEDIA_QUERY = "(min-width: 1280px)" as const;

export type HilltopAdsZoneConfig = {
  zoneId: string;
  kind: "multitag" | "popunder" | "banner-300x250";
  src: string;
};

export const HILLTOPADS_BLOG_ZONES: readonly HilltopAdsZoneConfig[] = [
  {
    zoneId: HILLTOPADS_BLOG_ZONE_ID,
    kind: "multitag",
    src: HILLTOPADS_BLOG_SCRIPT_SRC,
  },
  {
    zoneId: HILLTOPADS_POPUNDER_ZONE_ID,
    kind: "popunder",
    src: HILLTOPADS_POPUNDER_SCRIPT_SRC,
  },
];

export type HilltopAdsSidePosition = "left" | "right";

export type HilltopAdsSideBannerConfig = HilltopAdsZoneConfig & {
  side: HilltopAdsSidePosition;
  width: number;
  height: number;
};

export const HILLTOPADS_SIDE_BANNERS: Record<
  HilltopAdsSidePosition,
  HilltopAdsSideBannerConfig
> = {
  left: {
    side: "left",
    zoneId: HILLTOPADS_LEFT_BANNER_ZONE_ID,
    kind: "banner-300x250",
    src: HILLTOPADS_LEFT_BANNER_SCRIPT_SRC,
    width: 300,
    height: 250,
  },
  right: {
    side: "right",
    zoneId: HILLTOPADS_RIGHT_BANNER_ZONE_ID,
    kind: "banner-300x250",
    src: HILLTOPADS_RIGHT_BANNER_SCRIPT_SRC,
    width: 300,
    height: 250,
  },
};

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

type HilltopAdsWindow = Window & {
  __lcHilltopAdsExecuted?: boolean;
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
  zone: Pick<HilltopAdsZoneConfig, "zoneId" | "src"> = {
    zoneId: HILLTOPADS_BLOG_ZONE_ID,
    src: HILLTOPADS_BLOG_SCRIPT_SRC,
  },
): HilltopAdsScriptElement {
  const script = doc.createElement("script") as HilltopAdsScriptElement;
  script.settings = settings;
  script.src = zone.src;
  script.async = true;
  script.referrerPolicy = HILLTOPADS_REFERRER_POLICY;
  script.dataset.hilltopadsZone = zone.zoneId;
  return script;
}

export function markHilltopAdsExecuted(): void {
  if (typeof window === "undefined") return;
  (window as HilltopAdsWindow).__lcHilltopAdsExecuted = true;
}

export function cleanupHilltopAdsOnRouteExit(): void {
  if (typeof document !== "undefined") {
    document
      .querySelectorAll("script[data-hilltopads-zone]")
      .forEach((node) => node.remove());
  }

  if (typeof window === "undefined") return;
  const win = window as HilltopAdsWindow;
  if (win.__lcHilltopAdsExecuted) {
    win.__lcHilltopAdsExecuted = false;
    try {
      // HilltopAds scripts register global listeners/DOM outside React; reload
      // once on leaving /blog so non-blog routes stay completely clean.
      window.location.replace(window.location.href);
    } catch {
      // Ignore navigation errors in synthetic test environments.
    }
  }
}

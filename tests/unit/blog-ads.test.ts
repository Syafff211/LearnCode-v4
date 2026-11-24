import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn<() => string>(() => "/blog"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

import nextConfig from "../../next.config";
import BlogLayout, {
  metadata as blogLayoutMetadata,
} from "@/app/(marketing)/blog/layout";
import { BlogAds } from "@/components/blog/blog-ads";
import { BlogReferralBanner } from "@/components/blog/blog-referral-banner";
import {
  HILLTOPADS_BLOG_SCRIPT_SRC,
  HILLTOPADS_BLOG_ZONE_ID,
  HILLTOPADS_REFERRAL_BANNERS,
  HILLTOPADS_REFERRAL_BANNER_HEIGHT,
  HILLTOPADS_REFERRAL_BANNER_WIDTH,
  HILLTOPADS_REFERRAL_URL,
  HILLTOPADS_REFERRER_POLICY,
  createHilltopAdsScript,
  isBlogAdsRoute,
  normalizeBlogAdsPathname,
  type HilltopAdsScriptElement,
} from "@/lib/blog-ads";

describe("blog ads route matching", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/blog");
  });

  it("matches only public /blog routes", () => {
    expect(isBlogAdsRoute("/blog")).toBe(true);
    expect(isBlogAdsRoute("/blog/")).toBe(true);
    expect(isBlogAdsRoute("/blog/panduan-html")).toBe(true);
    expect(isBlogAdsRoute("/blog/category/javascript")).toBe(true);
    expect(isBlogAdsRoute("/blog?utm_source=test#toc")).toBe(true);
  });

  it("rejects all non-blog routes including /admin/blog and prefix lookalikes", () => {
    const nonBlogPaths = [
      "/",
      "/courses",
      "/courses/html-dasar",
      "/learn/pengenalan-html",
      "/playground",
      "/ai-tutor",
      "/dashboard",
      "/settings",
      "/about",
      "/privacy",
      "/login",
      "/register",
      "/admin",
      "/admin/blog",
      "/admin/blog/new",
      "/blogger",
      "/blog-preview",
      "",
      null,
      undefined,
    ];

    for (const path of nonBlogPaths) {
      expect(isBlogAdsRoute(path), `expected ${String(path)} to be false`).toBe(false);
    }
  });

  it("normalizes trailing slashes and query/hash fragments", () => {
    expect(normalizeBlogAdsPathname("/blog/?ref=1#section")).toBe("/blog");
    expect(normalizeBlogAdsPathname("/")).toBe("/");
    expect(normalizeBlogAdsPathname("relative/blog")).toBe("/");
  });
});

describe("HilltopAds script builder and blog-only rendering", () => {
  it("builds the exact HilltopAds script attributes for zone 7655493", () => {
    const fakeScript = {
      dataset: {} as DOMStringMap,
      src: "",
      async: false,
      referrerPolicy: "",
    } as unknown as HilltopAdsScriptElement;

    const fakeDoc = {
      createElement: vi.fn((tag: string) => {
        expect(tag).toBe("script");
        return fakeScript;
      }),
    } as unknown as Document;

    const script = createHilltopAdsScript(fakeDoc);
    expect(script.settings).toEqual({});
    expect(script.src).toBe(
      "//quarrelsomebitter.com/baXjVMsqd.GFlI0KYkWdcK/deImh9qu/ZrUJlckYP/TYc_2yNnTnU/0SOmTRMAtTNOzJYV1pN_T-Qv5yNtwv",
    );
    expect(script.src).toBe(HILLTOPADS_BLOG_SCRIPT_SRC);
    expect(script.async).toBe(true);
    expect(script.referrerPolicy).toBe("no-referrer-when-downgrade");
    expect(script.dataset.hilltopadsZone).toBe(HILLTOPADS_BLOG_ZONE_ID);
  });

  it("renders BlogAds container on /blog routes and stays empty elsewhere", () => {
    mockPathname.mockReturnValue("/blog");
    expect(renderToStaticMarkup(React.createElement(BlogAds))).toContain(
      `data-hilltopads-host="${HILLTOPADS_BLOG_ZONE_ID}"`,
    );

    mockPathname.mockReturnValue("/blog/tutorial-css");
    expect(renderToStaticMarkup(React.createElement(BlogAds))).toContain(
      `data-hilltopads-host="${HILLTOPADS_BLOG_ZONE_ID}"`,
    );

    for (const path of ["/", "/courses", "/ai-tutor", "/playground", "/admin/blog"]) {
      mockPathname.mockReturnValue(path);
      expect(renderToStaticMarkup(React.createElement(BlogAds))).toBe("");
    }
  });

  it("configures no-referrer-when-downgrade metadata and wraps children in BlogLayout", () => {
    expect(blogLayoutMetadata.referrer).toBe(HILLTOPADS_REFERRER_POLICY);

    mockPathname.mockReturnValue("/blog");
    const html = renderToStaticMarkup(
      React.createElement(
        BlogLayout,
        null,
        React.createElement("article", null, "Konten artikel"),
      ),
    );
    expect(html).toContain("<article>Konten artikel</article>");
    expect(html).toContain(`data-hilltopads-host="${HILLTOPADS_BLOG_ZONE_ID}"`);
  });

  it("sets Referrer-Policy to no-referrer-when-downgrade only for /blog headers in next.config.ts", async () => {
    const headerRules = (await nextConfig.headers?.()) ?? [];

    const globalRule = headerRules.find((rule) => rule.source === "/:path*");
    expect(globalRule?.headers).toContainEqual({
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    });

    const blogIndexRule = headerRules.find((rule) => rule.source === "/blog");
    expect(blogIndexRule?.headers).toContainEqual({
      key: "Referrer-Policy",
      value: "no-referrer-when-downgrade",
    });

    const blogSubpathRule = headerRules.find((rule) => rule.source === "/blog/:path*");
    expect(blogSubpathRule?.headers).toContainEqual({
      key: "Referrer-Policy",
      value: "no-referrer-when-downgrade",
    });
  });
});

describe("HilltopAds 728x90 referral banner", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/blog");
  });

  it("defines all three 728x90 referral banners pointing to ref=415472", () => {
    expect(HILLTOPADS_REFERRAL_URL).toBe("https://hilltopads.com/id?ref=415472");
    expect(HILLTOPADS_REFERRAL_BANNER_WIDTH).toBe(728);
    expect(HILLTOPADS_REFERRAL_BANNER_HEIGHT).toBe(90);
    expect(HILLTOPADS_REFERRAL_BANNERS.map((banner) => banner.src)).toEqual([
      "https://static.hilltopads.com/other/banners/pub/huge_income/728x90.gif?v=1795523369",
      "https://static.hilltopads.com/other/banners/pub/get_high_ecpm/728x90.gif?v=1795523369",
      "https://static.hilltopads.com/other/banners/pub/make_big_money/728x90.gif?v=1795523369",
    ]);
  });

  it("renders BlogReferralBanner only on public /blog routes with no-referrer-when-downgrade", () => {
    mockPathname.mockReturnValue("/blog");
    const blogHtml = renderToStaticMarkup(React.createElement(BlogReferralBanner));
    expect(blogHtml).toContain('data-hilltopads-referral-slot="728x90"');
    expect(blogHtml).toContain(`href="${HILLTOPADS_REFERRAL_URL}"`);
    expect(blogHtml).toContain('rel="noopener sponsored"');
    expect(blogHtml).toContain('referrerPolicy="no-referrer-when-downgrade"');
    expect(blogHtml).toContain(
      "https://static.hilltopads.com/other/banners/pub/huge_income/728x90.gif?v=1795523369",
    );
    expect(blogHtml).toContain('width="728"');
    expect(blogHtml).toContain('height="90"');

    mockPathname.mockReturnValue("/blog/category/html");
    expect(renderToStaticMarkup(React.createElement(BlogReferralBanner))).toContain(
      'data-hilltopads-referral-slot="728x90"',
    );

    for (const path of ["/", "/courses", "/ai-tutor", "/playground", "/admin/blog"]) {
      mockPathname.mockReturnValue(path);
      expect(renderToStaticMarkup(React.createElement(BlogReferralBanner))).toBe("");
    }
  });
});

import * as React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LoadingIndicator, LoadingScreen } from "@/components/loading-screen";
import {
  DEFAULT_LOADING_DELAY_MS,
  LOADING_GIF_SRC,
  LOADING_SCREEN_BACKGROUND,
  LOADING_VIDEO_SRC,
  getLoadingMediaSource,
  getNextLoadingMediaFallback,
  isDocumentReady,
  shouldShowNavigationLoading,
} from "@/lib/loading-screen";

describe("loading media priority and fallback", () => {
  it("prioritizes public/loading.mp4 over public/loading.gif", () => {
    expect(LOADING_VIDEO_SRC).toBe("/loading.mp4");
    expect(LOADING_GIF_SRC).toBe("/loading.gif");
    expect(getLoadingMediaSource("video")).toBe("/loading.mp4");
    expect(getLoadingMediaSource("gif")).toBe("/loading.gif");
    expect(getLoadingMediaSource("none")).toBeNull();
  });

  it("falls back from video to gif and then to none", () => {
    expect(getNextLoadingMediaFallback("video")).toBe("gif");
    expect(getNextLoadingMediaFallback("gif")).toBe("none");
    expect(getNextLoadingMediaFallback("none")).toBe("none");
  });

  it("reports document readiness accurately", () => {
    expect(isDocumentReady("complete")).toBe(true);
    expect(isDocumentReady("interactive")).toBe(false);
    expect(isDocumentReady("loading")).toBe(false);
    expect(isDocumentReady(undefined)).toBe(false);
  });
});

describe("navigation loading gating", () => {
  const origin = "https://learncode.web.id";
  const currentHref = "https://learncode.web.id/courses";

  it("enables loading only for genuine internal page transitions", () => {
    expect(
      shouldShowNavigationLoading({
        href: "/dashboard",
        currentHref,
        origin,
      }),
    ).toBe(true);

    expect(
      shouldShowNavigationLoading({
        href: "/learn/html-dasar",
        currentHref,
        origin,
      }),
    ).toBe(true);

    expect(
      shouldShowNavigationLoading({
        href: "/courses?level=pemula",
        currentHref,
        origin,
      }),
    ).toBe(true);
  });

  it("ignores same-route, hash-only, external, download, API, and modified clicks", () => {
    expect(
      shouldShowNavigationLoading({ href: "/courses", currentHref, origin }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({ href: "/courses#top", currentHref, origin }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({ href: "#kursus", currentHref, origin }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "https://example.com/other",
        currentHref,
        origin,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "mailto:halo@learncode.web.id",
        currentHref,
        origin,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/api/certificates/LC-2026-ABCDEFGH/pdf",
        currentHref,
        origin,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/auth/callback",
        currentHref,
        origin,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/dashboard",
        currentHref,
        origin,
        target: "_blank",
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/dashboard",
        currentHref,
        origin,
        download: true,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/dashboard",
        currentHref,
        origin,
        ctrlKey: true,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/dashboard",
        currentHref,
        origin,
        metaKey: true,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/dashboard",
        currentHref,
        origin,
        button: 1,
      }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({
        href: "/dashboard",
        currentHref,
        origin,
        defaultPrevented: true,
      }),
    ).toBe(false);
  });
});

describe("LoadingScreen SSR output", () => {
  it("renders centered #FAF9F5 overlay with video priority and zero visible text", () => {
    const html = renderToStaticMarkup(React.createElement(LoadingScreen));

    expect(html).toContain('data-loading-screen="true"');
    expect(html).toContain('data-media-kind="video"');
    expect(html).toContain(`background-color:${LOADING_SCREEN_BACKGROUND}`);
    expect(html).toContain(`src="${LOADING_VIDEO_SRC}"`);
    expect(html).toContain(`--loading-delay:${DEFAULT_LOADING_DELAY_MS}ms`);
    expect(html).toContain('data-delayed="true"');
    expect(html).toContain('data-contained="false"');

    // Strip tags to confirm no visible text, headings, or decorative labels are rendered.
    const visibleText = html.replace(/<[^>]+>/g, "").trim();
    expect(visibleText).toBe("");
  });

  it("renders nothing when inactive and supports immediate/contained props", () => {
    expect(
      renderToString(React.createElement(LoadingScreen, { active: false })),
    ).toBe("");

    const immediateContained = renderToStaticMarkup(
      React.createElement(LoadingScreen, { delayMs: 0, fullscreen: false }),
    );
    expect(immediateContained).toContain('data-delayed="false"');
    expect(immediateContained).toContain('data-contained="true"');
  });

  it("renders lightweight inline LoadingIndicator for small tasks", () => {
    const html = renderToStaticMarkup(
      React.createElement(LoadingIndicator, { label: "Memuat editor…" }),
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("Memuat editor…");
    expect(html).toContain("motion-reduce:animate-none");
  });
});

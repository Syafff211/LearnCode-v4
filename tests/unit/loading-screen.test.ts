import * as React from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import {
  acquireSuspenseBoundary,
  clearLoadingMediaCache,
  getActiveSuspenseCount,
  getCachedGifStatus,
  getCommittedPathname,
  isGlobalLoadingActive,
  isRouteNavigationActive,
  setCachedGifStatus,
  setCommittedPathname,
  startRouteNavigation,
  stopRouteNavigation,
} from "@/components/loading-context";
import {
  GlobalLoadingScreen,
  LoadingIndicator,
} from "@/components/loading-screen";
import { onRouterTransitionStart } from "@/instrumentation-client";
import {
  DEFAULT_LOADING_DELAY_MS,
  LOADING_GIF_SIZE,
  LOADING_GIF_SRC,
  isNavigationErrorAbort,
  normalizePathname,
  resolveTransitionPathname,
  shouldShowNavigationLoading,
} from "@/lib/loading-screen";

beforeEach(() => {
  clearLoadingMediaCache();
});

describe("loading screen constants and helpers", () => {
  it("uses public/loading.gif with intrinsic dimensions and unknown initial cache status", () => {
    expect(LOADING_GIF_SRC).toBe("/loading.gif");
    expect(LOADING_GIF_SIZE).toBe(420);
    expect(DEFAULT_LOADING_DELAY_MS).toBe(80);
    expect(getCachedGifStatus()).toBe("unknown");
  });

  it("normalizes pathnames consistently", () => {
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("/blog/")).toBe("/blog");
    expect(normalizePathname("/learn/html-dasar/")).toBe("/learn/html-dasar");
    expect(normalizePathname("")).toBe("/");
  });

  it("detects navigation abort/network error messages cleanly", () => {
    expect(isNavigationErrorAbort("ChunkLoadError: Loading chunk 123 failed")).toBe(true);
    expect(isNavigationErrorAbort("TypeError: Failed to fetch")).toBe(true);
    expect(isNavigationErrorAbort("Validation error: empty field")).toBe(false);
    expect(isNavigationErrorAbort(undefined)).toBe(false);
  });
});

describe("navigation loading gating", () => {
  const origin = "https://learncode.web.id";
  const currentPathname = "/courses";
  const currentHref = "https://learncode.web.id/courses";

  it("allows genuine internal route transitions across static and dynamic routes", () => {
    expect(
      resolveTransitionPathname({ href: "/blog", currentPathname: "/", origin }),
    ).toBe("/blog");
    expect(
      resolveTransitionPathname({ href: "/ai-tutor", currentPathname: "/", origin }),
    ).toBe("/ai-tutor");
    expect(
      resolveTransitionPathname({
        href: "/blog/belajar-css-grid",
        currentPathname: "/blog",
        origin,
      }),
    ).toBe("/blog/belajar-css-grid");
    expect(
      resolveTransitionPathname({
        href: "/courses/html-dasar",
        currentPathname: "/courses",
        origin,
      }),
    ).toBe("/courses/html-dasar");
    expect(
      resolveTransitionPathname({
        href: "/learn/teks-tautan-gambar",
        currentPathname: "/courses/html-dasar",
        origin,
      }),
    ).toBe("/learn/teks-tautan-gambar");
    expect(
      resolveTransitionPathname({
        href: "/learn/formulir-aksesibilitas",
        currentPathname: "/learn/teks-tautan-gambar",
        origin,
      }),
    ).toBe("/learn/formulir-aksesibilitas");
  });

  it("ignores query-only and hash-only URL changes on the same route", () => {
    expect(
      resolveTransitionPathname({
        href: "/courses?level=pemula",
        currentPathname,
        origin,
      }),
    ).toBeNull();
    expect(
      resolveTransitionPathname({
        href: "?category=css",
        currentPathname: "/blog",
        origin,
      }),
    ).toBeNull();
    expect(
      resolveTransitionPathname({
        href: "/courses#top",
        currentPathname,
        origin,
      }),
    ).toBeNull();
    expect(
      resolveTransitionPathname({
        href: "#materi",
        currentPathname: "/",
        origin,
      }),
    ).toBeNull();
  });

  it("ignores same-route, external, non-page API/auth, download, and modified clicks", () => {
    expect(
      shouldShowNavigationLoading({ href: "/courses", currentHref, origin }),
    ).toBe(false);
    expect(
      shouldShowNavigationLoading({ href: "/courses/", currentHref, origin }),
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

describe("route transition state and Next.js instrumentation hook", () => {
  it("tracks start/stop route state and clears pending state on rapid back navigation", () => {
    const previousWindow = (globalThis as { window?: unknown }).window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          origin: "https://learncode.web.id",
          pathname: "/blog",
        },
      },
    });

    try {
      setCommittedPathname("/blog");
      expect(getCommittedPathname()).toBe("/blog");
      expect(isRouteNavigationActive()).toBe(false);

      // Query-only transition never starts loading.
      onRouterTransitionStart("/blog?filter=css");
      expect(isRouteNavigationActive()).toBe(false);

      // Genuine route transition starts loading.
      onRouterTransitionStart("/blog/artikel-pertama");
      expect(isRouteNavigationActive()).toBe(true);

      // Browser back (traverse) back to committed /blog while pending stops loading immediately.
      onRouterTransitionStart("https://learncode.web.id/blog");
      expect(isRouteNavigationActive()).toBe(false);

      // Direct start/stop helpers toggle cleanly.
      startRouteNavigation();
      expect(isRouteNavigationActive()).toBe(true);
      expect(isGlobalLoadingActive()).toBe(true);
      stopRouteNavigation();
      expect(isRouteNavigationActive()).toBe(false);
      expect(isGlobalLoadingActive()).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    }
  });

  it("keeps global loading active across early pathname switches until Suspense boundaries finish streaming", () => {
    expect(isGlobalLoadingActive()).toBe(false);
    expect(getActiveSuspenseCount()).toBe(0);

    // 1. User clicks link -> route navigation begins.
    startRouteNavigation();
    expect(isGlobalLoadingActive()).toBe(true);

    // 2. Prefetched Suspense shell mounts loading.tsx before server RSC finishes.
    const releasePrimary = acquireSuspenseBoundary();
    const releaseNested = acquireSuspenseBoundary();
    expect(getActiveSuspenseCount()).toBe(2);

    // 3. Next.js commits pathname early -> NavigationWatcher calls stopRouteNavigation().
    //    Global loading MUST remain active because Suspense boundaries are still mounted!
    stopRouteNavigation();
    expect(isRouteNavigationActive()).toBe(false);
    expect(isGlobalLoadingActive()).toBe(true);

    // 4. Nested boundary finishes; primary still pending.
    releaseNested();
    releaseNested(); // idempotent cleanup must not decrement twice
    expect(getActiveSuspenseCount()).toBe(1);
    expect(isGlobalLoadingActive()).toBe(true);

    // 5. Real page content arrives -> primary loading.tsx unmounts -> loading ends cleanly.
    releasePrimary();
    expect(getActiveSuspenseCount()).toBe(0);
    expect(isGlobalLoadingActive()).toBe(false);
  });
});

describe("GlobalLoadingScreen SSR output", () => {
  it("renders centered loading.gif overlay using theme-aware CSS and zero visible text", () => {
    const html = renderToStaticMarkup(React.createElement(GlobalLoadingScreen));

    expect(html).toContain('data-loading-screen="true"');
    expect(html).toContain('data-media-kind="gif"');
    expect(html).toContain('class="loading-screen-overlay"');
    expect(html).toContain(`src="${LOADING_GIF_SRC}"`);
    expect(html).toContain(`width="${LOADING_GIF_SIZE}"`);
    expect(html).toContain(`height="${LOADING_GIF_SIZE}"`);
    expect(html).toContain(`--loading-delay:${DEFAULT_LOADING_DELAY_MS}ms`);
    expect(html).toContain('data-delayed="true"');
    expect(html).toContain('data-state="open"');
    expect(html).toContain('data-contained="false"');
    // Theme-aware CSS controls backgroundColor (light #FAF9F5 / dark #121310) rather than inline hardcode.
    expect(html).not.toContain("background-color:#FAF9F5");

    const visibleText = html.replace(/<[^>]+>/g, "").trim();
    expect(visibleText).toBe("");
  });

  it("renders safe static brand-mark fallback when loading.gif previously failed", () => {
    setCachedGifStatus("error");
    const html = renderToStaticMarkup(React.createElement(GlobalLoadingScreen));

    expect(html).toContain('data-loading-screen="true"');
    expect(html).toContain('data-media-kind="fallback"');
    expect(html).not.toContain("<img");
    expect(html).toContain("<svg");

    const visibleText = html.replace(/<[^>]+>/g, "").trim();
    expect(visibleText).toBe("");
  });

  it("renders nothing when inactive and supports immediate/contained props", () => {
    expect(
      renderToString(React.createElement(GlobalLoadingScreen, { active: false })),
    ).toBe("");

    const immediateContained = renderToStaticMarkup(
      React.createElement(GlobalLoadingScreen, { delayMs: 0, fullscreen: false }),
    );
    expect(immediateContained).toContain('data-delayed="false"');
    expect(immediateContained).toContain('data-contained="true"');
  });

  it("renders lightweight inline LoadingIndicator for small local states", () => {
    const html = renderToStaticMarkup(
      React.createElement(LoadingIndicator, { label: "Memuat editor…" }),
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("Memuat editor…");
    expect(html).toContain("motion-reduce:animate-none");
  });
});

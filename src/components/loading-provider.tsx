"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  LoadingContext,
  acquireSuspenseBoundary,
  getCachedGifStatus,
  isGlobalLoadingActive,
  isRouteNavigationActive,
  setCachedGifStatus,
  setCommittedPathname,
  stopRouteNavigation,
  subscribeRouteNavigation,
  type LoadingContextValue,
} from "@/components/loading-context";
import { GlobalLoadingScreen } from "@/components/loading-screen";
import {
  DEFAULT_LOADING_SAFETY_TIMEOUT_MS,
  LOADING_GIF_SRC,
  isNavigationErrorAbort,
  normalizePathname,
} from "@/lib/loading-screen";

function getServerLoadingSnapshot(): boolean {
  return false;
}

function NavigationWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  React.useEffect(() => {
    setCommittedPathname(pathname);
    // Clear the pre-commit navigation lock once the router commits the new URL.
    // If a route `loading.tsx` Suspense boundary is still streaming dynamic server
    // data (`activeSuspenseCount > 0`), `isGlobalLoadingActive()` stays `true`
    // until that boundary unmounts alongside the rendered page content.
    stopRouteNavigation();
  }, [pathname, search]);

  React.useEffect(() => {
    const onPopState = () => {
      if (
        normalizePathname(window.location.pathname) ===
        normalizePathname(pathname)
      ) {
        stopRouteNavigation();
      }
    };

    const onPageShow = () => {
      stopRouteNavigation();
    };

    const onOffline = () => {
      stopRouteNavigation();
    };

    const onError = (event: ErrorEvent) => {
      if (!isRouteNavigationActive()) return;
      if (isNavigationErrorAbort(event.message)) {
        stopRouteNavigation();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isRouteNavigationActive()) return;
      const reason =
        event.reason instanceof Error
          ? event.reason.message
          : typeof event.reason === "string"
            ? event.reason
            : "";
      if (isNavigationErrorAbort(reason)) {
        stopRouteNavigation();
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("offline", onOffline);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [pathname]);

  return null;
}

export function AppLoadingProvider({ children }: { children: React.ReactNode }) {
  const loadingActive = React.useSyncExternalStore(
    subscribeRouteNavigation,
    isGlobalLoadingActive,
    getServerLoadingSnapshot,
  );

  // Pre-warm /loading.gif once when the browser is idle so first navigation
  // renders immediately from cache (skipped under prefers-reduced-motion).
  React.useEffect(() => {
    if (getCachedGifStatus() !== "unknown") return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cancelled = false;
    const warm = () => {
      if (cancelled || getCachedGifStatus() !== "unknown") return;
      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => setCachedGifStatus("loaded");
      img.onerror = () => setCachedGifStatus("error");
      img.src = LOADING_GIF_SRC;
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(warm, { timeout: 1200 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(idleId);
      };
    }
    const timer = window.setTimeout(warm, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // Fail-safe guard: if a network/server error causes a transition to stall
  // without settling, unlock the pre-commit flag instead of hanging forever.
  React.useEffect(() => {
    if (!loadingActive) return;
    const timer = window.setTimeout(() => {
      stopRouteNavigation();
    }, DEFAULT_LOADING_SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [loadingActive]);

  const contextValue = React.useMemo<LoadingContextValue>(
    () => ({
      isNavigationActive: isGlobalLoadingActive,
      acquireSuspense: acquireSuspenseBoundary,
    }),
    [],
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <Suspense fallback={null}>
        <NavigationWatcher />
      </Suspense>
      <GlobalLoadingScreen active={loadingActive} managed />
    </LoadingContext.Provider>
  );
}

"use client";

import * as React from "react";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  LoadingContext,
  getCachedGifStatus,
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

function getServerNavigationSnapshot(): boolean {
  return false;
}

function NavigationWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  React.useEffect(() => {
    setCommittedPathname(pathname);
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
  const navActive = React.useSyncExternalStore(
    subscribeRouteNavigation,
    isRouteNavigationActive,
    getServerNavigationSnapshot,
  );

  // Pre-warm /loading.gif once when the browser is idle so first navigation
  // renders immediately from cache (skipped under prefers-reduced-motion).
  React.useEffect(() => {
    if (getCachedGifStatus() !== null) return;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cancelled = false;
    const warm = () => {
      if (cancelled || getCachedGifStatus() !== null) return;
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
      const idleId = win.requestIdleCallback(warm, { timeout: 2500 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(idleId);
      };
    }
    const timer = window.setTimeout(warm, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // Fail-safe guard: if a network/server error causes a transition to stall
  // without settling, unlock the screen instead of hanging forever.
  React.useEffect(() => {
    if (!navActive) return;
    const timer = window.setTimeout(() => {
      stopRouteNavigation();
    }, DEFAULT_LOADING_SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [navActive]);

  const contextValue = React.useMemo<LoadingContextValue>(
    () => ({
      isNavigationActive: isRouteNavigationActive,
    }),
    [],
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <Suspense fallback={null}>
        <NavigationWatcher />
      </Suspense>
      <GlobalLoadingScreen active={navActive} managed />
    </LoadingContext.Provider>
  );
}

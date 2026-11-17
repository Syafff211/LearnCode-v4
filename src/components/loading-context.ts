"use client";

import * as React from "react";

export type LoadingContextValue = {
  isNavigationActive: () => boolean;
};

export const LoadingContext = React.createContext<LoadingContextValue | null>(null);

export type GifCacheStatus = "unknown" | "loaded" | "error";

type NavigationListener = (active: boolean) => void;

const navigationListeners = new Set<NavigationListener>();
let committedPathname: string | null = null;
let routeNavigationActive = false;
let notifyQueued = false;

let cachedGifStatus: GifCacheStatus = "unknown";

function flushNavigationListeners(): void {
  notifyQueued = false;
  for (const listener of navigationListeners) {
    listener(routeNavigationActive);
  }
}

function scheduleNavigationNotification(): void {
  if (notifyQueued) return;
  notifyQueued = true;
  if (typeof queueMicrotask === "function") {
    queueMicrotask(flushNavigationListeners);
  } else {
    void Promise.resolve().then(flushNavigationListeners);
  }
}

export function getCommittedPathname(): string | null {
  return committedPathname;
}

export function setCommittedPathname(pathname: string | null): void {
  committedPathname = pathname;
}

export function isRouteNavigationActive(): boolean {
  return routeNavigationActive;
}

export function startRouteNavigation(): void {
  if (routeNavigationActive) return;
  routeNavigationActive = true;
  // Defer notification via microtask so React state updates escape Next.js's
  // router startTransition batch and commit immediately while the new route loads.
  scheduleNavigationNotification();
}

export function stopRouteNavigation(): void {
  if (!routeNavigationActive) return;
  routeNavigationActive = false;
  scheduleNavigationNotification();
}

export function subscribeRouteNavigation(
  listener: NavigationListener,
): () => void {
  navigationListeners.add(listener);
  return () => {
    navigationListeners.delete(listener);
  };
}

export function getCachedGifStatus(): GifCacheStatus {
  return cachedGifStatus;
}

export function setCachedGifStatus(status: GifCacheStatus): void {
  cachedGifStatus = status;
}

export function clearLoadingMediaCache(): void {
  cachedGifStatus = "unknown";
  committedPathname = null;
  routeNavigationActive = false;
  notifyQueued = false;
}

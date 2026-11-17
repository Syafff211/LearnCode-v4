"use client";

import * as React from "react";

export type LoadingContextValue = {
  isNavigationActive: () => boolean;
  acquireSuspense: () => () => void;
};

export const LoadingContext = React.createContext<LoadingContextValue | null>(null);

export type GifCacheStatus = "unknown" | "loaded" | "error";

type LoadingListener = (active: boolean) => void;

const loadingListeners = new Set<LoadingListener>();
let committedPathname: string | null = null;
let routeNavigationActive = false;
let activeSuspenseCount = 0;
let notifyQueued = false;

let cachedGifStatus: GifCacheStatus = "unknown";

export function isGlobalLoadingActive(): boolean {
  return routeNavigationActive || activeSuspenseCount > 0;
}

function flushLoadingListeners(): void {
  notifyQueued = false;
  const active = isGlobalLoadingActive();
  for (const listener of loadingListeners) {
    listener(active);
  }
}

function scheduleLoadingNotification(): void {
  if (notifyQueued) return;
  notifyQueued = true;
  if (typeof queueMicrotask === "function") {
    queueMicrotask(flushLoadingListeners);
  } else {
    void Promise.resolve().then(flushLoadingListeners);
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

export function getActiveSuspenseCount(): number {
  return activeSuspenseCount;
}

export function startRouteNavigation(): void {
  if (routeNavigationActive) return;
  routeNavigationActive = true;
  // Defer notification via microtask so React state updates escape Next.js's
  // router startTransition batch and commit immediately while the new route loads.
  scheduleLoadingNotification();
}

export function stopRouteNavigation(): void {
  if (!routeNavigationActive) return;
  routeNavigationActive = false;
  scheduleLoadingNotification();
}

export function acquireSuspenseBoundary(): () => void {
  activeSuspenseCount += 1;
  scheduleLoadingNotification();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeSuspenseCount = Math.max(0, activeSuspenseCount - 1);
    scheduleLoadingNotification();
  };
}

export function subscribeRouteNavigation(
  listener: LoadingListener,
): () => void {
  loadingListeners.add(listener);
  return () => {
    loadingListeners.delete(listener);
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
  activeSuspenseCount = 0;
  notifyQueued = false;
}

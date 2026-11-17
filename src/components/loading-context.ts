"use client";

import * as React from "react";

import type { LoadingMediaKind } from "@/lib/loading-screen";

export type LoadingContextValue = {
  startTask: (id: string) => void;
  stopTask: (id: string) => void;
  registerRouteBoundary: () => () => void;
  isTransitionRevealed: () => boolean;
  setTransitionRevealed: (revealed: boolean) => void;
};

export const LoadingContext = React.createContext<LoadingContextValue | null>(null);

const resolvedMediaCache = new Map<string, LoadingMediaKind>();
let clientHydrated = false;

export function hasClientHydrated(): boolean {
  return clientHydrated;
}

export function markClientHydrated(): void {
  clientHydrated = true;
}

export function getCachedMediaKind(key: string): LoadingMediaKind | undefined {
  return resolvedMediaCache.get(key);
}

export function setCachedMediaKind(key: string, kind: LoadingMediaKind): void {
  resolvedMediaCache.set(key, kind);
}

export function clearLoadingMediaCache(): void {
  resolvedMediaCache.clear();
  clientHydrated = false;
}

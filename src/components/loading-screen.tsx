"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import {
  LoadingContext,
  getCachedGifStatus,
  setCachedGifStatus,
} from "@/components/loading-context";
import { LogoMark } from "@/components/logo";
import {
  DEFAULT_LOADING_DELAY_MS,
  DEFAULT_LOADING_FADE_MS,
  LOADING_GIF_SIZE,
  LOADING_GIF_SRC,
  type LoadingMediaKind,
} from "@/lib/loading-screen";
import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  }
  media.addListener(onStoreChange);
  return () => media.removeListener(onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

export type GlobalLoadingScreenProps = {
  /** Whether the loading screen is active. Defaults to true for Next.js loading.tsx boundaries. */
  active?: boolean;
  /** Anti-flicker reveal delay in ms. Defaults to 80ms. Pass 0 for immediate display. */
  delayMs?: number;
  /** Render full-viewport overlay (default) or fill the nearest positioned container. */
  fullscreen?: boolean;
  /** Override loading GIF path (defaults to /loading.gif). */
  gifSrc?: string;
  /** Internal flag used by AppLoadingProvider's single managed root overlay. */
  managed?: boolean;
  className?: string;
};

/**
 * Official reusable LearnCode global loading screen (`GlobalLoadingScreen`).
 *
 * Displays only the centered `/loading.gif` brand logo animation over the
 * active theme background (`#FAF9F5` in light mode, `#121310` in dark mode),
 * with zero extra text, labels, spinners, or decorative elements.
 * Falls back safely to the static brand mark if the GIF fails to load or when
 * `prefers-reduced-motion: reduce` is enabled.
 */
export function GlobalLoadingScreen({
  active = true,
  delayMs = DEFAULT_LOADING_DELAY_MS,
  fullscreen = true,
  gifSrc = LOADING_GIF_SRC,
  managed = false,
  className,
}: GlobalLoadingScreenProps) {
  const ctx = React.useContext(LoadingContext);
  const reducedMotion = usePrefersReducedMotion();
  const effectiveDelayMs = Math.max(0, delayMs);

  // When rendered inside a Next.js `loading.tsx` Suspense boundary wrapped by
  // AppLoadingProvider, register this boundary so the single managed overlay
  // stays visible for the entire duration of the Suspense wait (without
  // overlapping or restarting the GIF), even after `usePathname()` updates early.
  useIsomorphicLayoutEffect(() => {
    if (managed || !ctx || !active) return;
    return ctx.acquireSuspense();
  }, [managed, ctx, active]);

  const [prevActive, setPrevActive] = React.useState(active);
  const [revealed, setRevealed] = React.useState(
    () => active && effectiveDelayMs === 0,
  );
  const [closing, setClosing] = React.useState(false);

  if (managed && active !== prevActive) {
    setPrevActive(active);
    if (active) {
      if (closing) setClosing(false);
      setRevealed(effectiveDelayMs === 0);
    } else if (revealed) {
      setClosing(true);
    }
  }

  const [gifFailed, setGifFailed] = React.useState<boolean>(
    () => getCachedGifStatus() === "error",
  );

  React.useEffect(() => {
    if (!managed || !active || revealed) return;
    const timer = window.setTimeout(() => {
      setRevealed(true);
    }, effectiveDelayMs);
    return () => window.clearTimeout(timer);
  }, [managed, active, revealed, effectiveDelayMs]);

  React.useEffect(() => {
    if (!managed || active || !closing) return;
    const timer = window.setTimeout(() => {
      setClosing(false);
      setRevealed(false);
    }, DEFAULT_LOADING_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [managed, active, closing]);

  if (managed) {
    if (!active && !closing) return null;
  } else if (!active || ctx !== null) {
    return null;
  }

  const useFallback = reducedMotion || gifFailed;
  const mediaKind: LoadingMediaKind = useFallback ? "fallback" : "gif";
  const isDelayed = effectiveDelayMs > 0 && (!managed || !closing);
  const stateAttr = managed && !active && closing ? "closing" : "open";
  const revealedAttr = managed ? (revealed && stateAttr === "open" ? "true" : "false") : "true";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={stateAttr === "open" ? "true" : "false"}
      aria-label="Memuat"
      data-loading-screen="true"
      data-managed={managed ? "true" : "false"}
      data-media-kind={mediaKind}
      data-delayed={isDelayed ? "true" : "false"}
      data-revealed={revealedAttr}
      data-state={stateAttr}
      data-contained={fullscreen ? "false" : "true"}
      style={
        isDelayed
          ? ({ "--loading-delay": `${effectiveDelayMs}ms` } as React.CSSProperties)
          : undefined
      }
      className={cn("loading-screen-overlay", className)}
    >
      {mediaKind === "gif" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gifSrc}
          width={LOADING_GIF_SIZE}
          height={LOADING_GIF_SIZE}
          alt=""
          loading="eager"
          decoding="async"
          draggable={false}
          onLoad={() => setCachedGifStatus("loaded")}
          onError={() => {
            setCachedGifStatus("error");
            setGifFailed(true);
          }}
          className="loading-screen-media"
          aria-hidden="true"
        />
      ) : (
        <LogoMark className="loading-screen-media" />
      )}
    </div>
  );
}

/**
 * Lightweight inline loading indicator for small local component states
 * (loading an AI Tutor saved conversation or initializing the Monaco editor)
 * where a full-screen route overlay must never appear.
 */
export function LoadingIndicator({
  label = "Memuat…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 text-xs text-muted",
        className,
      )}
    >
      <LoaderCircle
        className="size-3.5 shrink-0 animate-spin text-accent-text motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

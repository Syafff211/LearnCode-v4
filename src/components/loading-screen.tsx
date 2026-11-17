"use client";

import * as React from "react";
import { LoaderCircle } from "lucide-react";

import {
  LoadingContext,
  getCachedMediaKind,
  hasClientHydrated,
  markClientHydrated,
  setCachedMediaKind,
} from "@/components/loading-context";
import {
  DEFAULT_LOADING_DELAY_MS,
  LOADING_GIF_SRC,
  LOADING_SCREEN_BACKGROUND,
  LOADING_VIDEO_SRC,
  getLoadingMediaSource,
  getNextLoadingMediaFallback,
  type LoadingMediaKind,
} from "@/lib/loading-screen";
import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

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

export type LoadingScreenProps = {
  /** Whether the loading screen is active. Defaults to true for Next.js loading.tsx boundaries. */
  active?: boolean;
  /** Anti-flicker reveal delay in ms. Defaults to 150ms. Pass 0 for immediate display. */
  delayMs?: number;
  /** Render full-viewport overlay (default) or fill the nearest positioned container. */
  fullscreen?: boolean;
  /** Override primary MP4 path (defaults to /loading.mp4). */
  videoSrc?: string;
  /** Override fallback GIF path (defaults to /loading.gif). */
  gifSrc?: string;
  /** Internal flag used by AppLoadingProvider's root overlay. */
  managed?: boolean;
  className?: string;
};

/**
 * Official LearnCode loading screen.
 *
 * Displays only the centered logo animation (`public/loading.mp4` first, falling
 * back to `public/loading.gif`) over `#FAF9F5` without text or decorative UI.
 */
export function LoadingScreen({
  active = true,
  delayMs = DEFAULT_LOADING_DELAY_MS,
  fullscreen = true,
  videoSrc = LOADING_VIDEO_SRC,
  gifSrc = LOADING_GIF_SRC,
  managed = false,
  className,
}: LoadingScreenProps) {
  const ctx = React.useContext(LoadingContext);
  const reducedMotion = usePrefersReducedMotion();
  const cacheKey = `${videoSrc}|${gifSrc}`;

  const [mediaKind, setMediaKind] = React.useState<LoadingMediaKind>(() =>
    hasClientHydrated() ? (getCachedMediaKind(cacheKey) ?? "video") : "video",
  );
  const [skipDelay] = React.useState<boolean>(() =>
    Boolean(!managed && hasClientHydrated() && ctx?.isTransitionRevealed()),
  );
  const [gifFrozen, setGifFrozen] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const effectiveDelayMs = skipDelay ? 0 : Math.max(0, delayMs);

  React.useEffect(() => {
    markClientHydrated();
  }, []);

  React.useEffect(() => {
    if (managed || !active || !ctx) return;
    return ctx.registerRouteBoundary();
  }, [managed, active, ctx]);

  React.useEffect(() => {
    if (!active || !ctx) return;

    if (effectiveDelayMs === 0) {
      ctx.setTransitionRevealed(true);
      return () => {
        ctx.setTransitionRevealed(false);
      };
    }

    const timer = window.setTimeout(() => {
      ctx.setTransitionRevealed(true);
    }, effectiveDelayMs);

    return () => {
      window.clearTimeout(timer);
      ctx.setTransitionRevealed(false);
    };
  }, [active, effectiveDelayMs, ctx]);

  React.useEffect(() => {
    if (!active || mediaKind !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    if (reducedMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // Autoplay may be blocked by browser energy-saver policies; keep the first frame visible.
    });
  }, [active, mediaKind, reducedMotion]);

  if (!active) return null;

  const currentSrc = getLoadingMediaSource(mediaKind, { videoSrc, gifSrc });

  const handleVideoLoaded = (event: React.SyntheticEvent<HTMLVideoElement>) => {
    setCachedMediaKind(cacheKey, "video");
    if (reducedMotion) {
      event.currentTarget.pause();
    }
  };

  const handleVideoError = () => {
    const next = getNextLoadingMediaFallback("video");
    setCachedMediaKind(cacheKey, next);
    setGifFrozen(false);
    setMediaKind(next);
  };

  const handleGifLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setCachedMediaKind(cacheKey, "gif");
    if (!reducedMotion) {
      if (gifFrozen) setGifFrozen(false);
      return;
    }

    const img = event.currentTarget;
    const canvas = canvasRef.current;
    if (!canvas || img.naturalWidth <= 0 || img.naturalHeight <= 0) return;

    try {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
      setGifFrozen(true);
    } catch {
      setGifFrozen(false);
    }
  };

  const handleGifError = () => {
    const next = getNextLoadingMediaFallback("gif");
    setCachedMediaKind(cacheKey, next);
    setGifFrozen(false);
    setMediaKind(next);
  };

  const isDelayed = effectiveDelayMs > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Memuat"
      data-loading-screen="true"
      data-media-kind={mediaKind}
      data-delayed={isDelayed ? "true" : "false"}
      data-contained={fullscreen ? "false" : "true"}
      style={
        {
          backgroundColor: LOADING_SCREEN_BACKGROUND,
          ...(isDelayed ? { "--loading-delay": `${effectiveDelayMs}ms` } : {}),
        } as React.CSSProperties
      }
      className={cn("loading-screen-overlay", className)}
    >
      {mediaKind === "video" && currentSrc ? (
        <video
          ref={videoRef}
          src={currentSrc}
          autoPlay={!reducedMotion}
          loop={!reducedMotion}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          onLoadedData={handleVideoLoaded}
          onError={handleVideoError}
          className="loading-screen-media"
          aria-hidden="true"
        />
      ) : null}

      {mediaKind === "gif" && currentSrc ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSrc}
            alt=""
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            draggable={false}
            onLoad={handleGifLoad}
            onError={handleGifError}
            className={cn(
              "loading-screen-media",
              reducedMotion && gifFrozen && "hidden",
            )}
            aria-hidden="true"
          />
          {reducedMotion ? (
            <canvas
              ref={canvasRef}
              className={cn("loading-screen-media", !gifFrozen && "hidden")}
              aria-hidden="true"
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/**
 * Lightweight inline loading indicator for small local actions (loading a
 * single chat conversation, searching history, or lazy-loading an embedded editor)
 * where a full-screen overlay would interrupt the user.
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

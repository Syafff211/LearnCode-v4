"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, RotateCcw, SkipForward, Volume2, VolumeX } from "lucide-react";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_INTRO_VIDEO_FREQUENCY,
  DEFAULT_INTRO_VIDEO_SRC,
  INTRO_VIDEO_REPLAY_EVENT,
  INTRO_VIDEO_SEEN_VALUE,
  INTRO_VIDEO_STORAGE_KEY,
  shouldShowIntroVideo,
  type IntroVideoFrequency,
} from "@/lib/intro-video";
import { cn } from "@/lib/utils";

type IntroState = "hidden" | "playing" | "ended";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Storage can be blocked by the browser; a missing value simply replays the intro. */
function readSeenValue(): string | null {
  try {
    return window.localStorage.getItem(INTRO_VIDEO_STORAGE_KEY);
  } catch {
    return null;
  }
}

function rememberSeen() {
  try {
    window.localStorage.setItem(INTRO_VIDEO_STORAGE_KEY, INTRO_VIDEO_SEEN_VALUE);
  } catch {
    // Private mode: the intro shows again next visit. Not worth interrupting for.
  }
}

/**
 * Full-screen intro clip for the landing page.
 *
 * Autoplay only works muted, so the video starts silent with an un-mute
 * control. If the file is missing, blocked by the browser, or fails to decode,
 * the overlay closes itself and the landing page is usable as usual — an intro
 * must never be able to hold the page hostage.
 */
export function LandingIntroVideo({
  src = DEFAULT_INTRO_VIDEO_SRC,
  frequency = DEFAULT_INTRO_VIDEO_FREQUENCY,
}: {
  src?: string;
  frequency?: IntroVideoFrequency;
}) {
  const [state, setState] = React.useState<IntroState>("hidden");
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [progress, setProgress] = React.useState(0);
  const [closing, setClosing] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const skipRef = React.useRef<HTMLButtonElement | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const openRef = React.useRef(false);

  const open = React.useCallback((remember: boolean) => {
    if (remember) rememberSeen();
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    openRef.current = true;
    setProgress(0);
    setClosing(false);
    setState("playing");
  }, []);

  const close = React.useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setPlaying(false);
    setClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setClosing(false);
      setState("hidden");
    }, 170);
  }, []);

  // First landing visit (unless the visitor asked for reduced motion). Deferred
  // so the check stays off the render/LCP path, like the promotion popup.
  React.useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setTimeout(() => {
      if (shouldShowIntroVideo(readSeenValue(), frequency)) open(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [frequency, open]);

  // Replay control dispatched from the landing hero.
  React.useEffect(() => {
    const replay = () => {
      setMuted(true);
      open(false);
    };
    window.addEventListener(INTRO_VIDEO_REPLAY_EVENT, replay);
    return () => window.removeEventListener(INTRO_VIDEO_REPLAY_EVENT, replay);
  }, [open]);

  // While open: lock scrolling, allow Escape, and move focus into the dialog.
  React.useEffect(() => {
    if (state === "hidden") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    skipRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [state, close]);

  React.useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const play = React.useCallback(() => {
    void videoRef.current?.play().catch(() => {
      // Autoplay blocked: the manual play button stays available.
    });
  }, []);

  const handleTimeUpdate = React.useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const { currentTime, duration } = event.currentTarget;
    if (!Number.isFinite(duration) || duration <= 0) return;
    setProgress(Math.min(1, Math.max(0, currentTime / duration)));
  }, []);

  if (state === "hidden") return null;

  return (
    <div
      className="intro-video-backdrop"
      data-state={closing ? "closing" : "open"}
      role="dialog"
      aria-modal="true"
      aria-label="Video intro LearnCode"
    >
      <div className="intro-video-shell">
        <div className="intro-video-topbar">
          <span className="inline-flex items-center gap-2 text-[#f1eee5]">
            <LogoMark className="size-6" />
            <span className="font-display text-base font-semibold tracking-[-0.02em]">
              LearnCode
            </span>
          </span>
          <button type="button" ref={skipRef} className="intro-video-control" onClick={close}>
            Lewati intro
            <SkipForward className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="intro-video-frame">
          <video
            ref={videoRef}
            src={src}
            autoPlay
            muted={muted}
            playsInline
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setPlaying(false);
              setProgress(1);
              setState("ended");
            }}
            // A missing or undecodable file must not block the landing page.
            onError={close}
            className="intro-video-media"
          />

          {state === "playing" && !playing ? (
            <button
              type="button"
              className="intro-video-play"
              onClick={play}
              aria-label="Putar video intro"
            >
              <Play className="size-5" aria-hidden="true" />
              <span>Putar intro</span>
            </button>
          ) : null}

          {state === "ended" ? (
            <div className="intro-video-endcard">
              <p className="intro-video-eyebrow">LearnCode</p>
              <p className="intro-video-title">Belajar coding dengan membangun sesuatu.</p>
              <div className="intro-video-actions">
                <Button asChild size="lg">
                  <Link href="/register">
                    Mulai belajar
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="border-[rgb(241_238_229/0.22)] bg-[rgb(241_238_229/0.08)] text-[#f1eee5] hover:bg-[rgb(241_238_229/0.16)]"
                  onClick={() => open(false)}
                >
                  <RotateCcw aria-hidden="true" />
                  Putar ulang
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="intro-video-footer">
          <div
            className="intro-video-progress"
            role="progressbar"
            aria-label="Progres video intro"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <button
            type="button"
            className={cn("intro-video-control", muted && "is-muted")}
            onClick={() => {
              const next = !muted;
              setMuted(next);
              if (videoRef.current) videoRef.current.muted = next;
              if (!next) play();
            }}
            aria-pressed={!muted}
          >
            {muted ? (
              <VolumeX className="size-3.5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-3.5" aria-hidden="true" />
            )}
            {muted ? "Nyalakan suara" : "Bisukan"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Lets a returning visitor watch the intro again from the landing hero.
 * Rendered next to the hero calls to action.
 */
export function IntroReplayButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => window.dispatchEvent(new Event(INTRO_VIDEO_REPLAY_EVENT))}
    >
      <Play aria-hidden="true" />
      Putar intro
    </Button>
  );
}

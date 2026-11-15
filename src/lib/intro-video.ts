/**
 * Landing intro video.
 *
 * A short, optional full-screen clip played when a visitor opens the landing
 * page. The default source is `public/intro.mp4`; set
 * `NEXT_PUBLIC_INTRO_VIDEO_URL` to serve the file from somewhere else (for
 * example a Supabase Storage public link) instead of shipping it in the build.
 *
 * Everything in this module is pure so the gating rules can be unit tested.
 * Playback, storage access and DOM work live in
 * `src/components/marketing/intro-video.tsx`.
 */

export const DEFAULT_INTRO_VIDEO_SRC = "/intro.mp4";

/** localStorage key remembering that the visitor already watched the intro. */
export const INTRO_VIDEO_STORAGE_KEY = "learncode:intro-video";
export const INTRO_VIDEO_SEEN_VALUE = "seen";

/** Event a replay control dispatches to open the intro again on demand. */
export const INTRO_VIDEO_REPLAY_EVENT = "learncode:intro-video:replay";

/**
 * `once`  – show on the first landing visit, then remember it (default).
 * `always` – show on every landing load.
 */
export type IntroVideoFrequency = "once" | "always";

export const DEFAULT_INTRO_VIDEO_FREQUENCY: IntroVideoFrequency = "once";

export function parseIntroFrequency(
  value: string | null | undefined,
): IntroVideoFrequency {
  return value === "always" ? "always" : DEFAULT_INTRO_VIDEO_FREQUENCY;
}

/**
 * Only a site-relative path (`/intro.mp4`) or an absolute http(s) URL is
 * accepted. Anything else — `javascript:`, `data:`, a protocol-relative
 * `//host/x.mp4` — disables the intro instead of rendering it.
 */
export function isAllowedIntroSource(value: string | null | undefined): boolean {
  const source = value?.trim();
  if (!source) return false;
  if (source.startsWith("/") && !source.startsWith("//")) return true;

  try {
    const { protocol } = new URL(source);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolve the configured source. Returns the default path when nothing is
 * configured, and `null` when the configured value is unusable — callers then
 * render no intro at all rather than a broken video.
 */
export function resolveIntroVideoSource(
  value: string | null | undefined,
): string | null {
  const source = value?.trim();
  if (!source) return DEFAULT_INTRO_VIDEO_SRC;
  return isAllowedIntroSource(source) ? source : null;
}

export function hasSeenIntroVideo(stored: string | null | undefined): boolean {
  return stored === INTRO_VIDEO_SEEN_VALUE;
}

/**
 * Whether the intro should open for this visit. `stored` is the raw
 * localStorage value; a visitor with disabled storage reads back `null` and
 * therefore sees the intro, which is the acceptable failure mode.
 */
export function shouldShowIntroVideo(
  stored: string | null | undefined,
  frequency: IntroVideoFrequency = DEFAULT_INTRO_VIDEO_FREQUENCY,
): boolean {
  if (frequency === "always") return true;
  return !hasSeenIntroVideo(stored);
}

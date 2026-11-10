const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** Return whether a value has YouTube's 11-character video-ID shape. */
export function isYouTubeVideoId(value: unknown): value is string {
  return typeof value === "string" && VIDEO_ID_PATTERN.test(value);
}

/**
 * Accept only ordinary YouTube watch, short, live, and embed links and return
 * their video ID. The caller must build any embed URL from this validated ID;
 * raw iframe HTML and look-alike hosts are never accepted.
 */
export function parseYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (!input || input.length > 500) return null;

  const candidate = /^(?:(?:www|m|music)\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)(?:\/|$)/i.test(
    input,
  )
    ? `https://${input}`
    : input;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    !YOUTUBE_HOSTS.has(host) ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    url.port.length > 0
  ) {
    return null;
  }

  let videoId: string | null = null;
  if (host === "youtu.be" || host === "www.youtu.be") {
    const match = url.pathname.match(/^\/([^/]+)\/?$/);
    videoId = match?.[1] ?? null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else {
    const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/]+)\/?$/);
    if (match) {
      const route = match[1];
      if (!host.includes("youtube-nocookie.com") || route === "embed") {
        videoId = match[2] ?? null;
      }
    }
  }

  return isYouTubeVideoId(videoId) ? videoId : null;
}

/** Canonical public fallback URL, constructed only from a validated ID. */
export function getYouTubeWatchUrl(videoId: string): string | null {
  return isYouTubeVideoId(videoId) ? `https://youtu.be/${videoId}` : null;
}

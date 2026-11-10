import { describe, expect, it } from "vitest";

import { getYouTubeWatchUrl, isYouTubeVideoId, parseYouTubeVideoId } from "@/lib/youtube";

describe("YouTube lesson video URL parsing", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=20", "dQw4w9WgXcQ"],
    ["https://youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extracts a video ID from %s", (url, id) => {
    expect(parseYouTubeVideoId(url)).toBe(id);
  });

  it.each([
    "",
    "<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\"></iframe>",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
    "https://youtube.com@evil.example/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=short",
    "https://youtube.com/watch?v=dQw4w9WgXcQ%2Fextra",
    "http://youtube.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
    "https://youtube-nocookie.com/shorts/dQw4w9WgXcQ",
  ])("rejects unsafe or unsupported URL %s", (url) => {
    expect(parseYouTubeVideoId(url)).toBeNull();
  });

  it("validates IDs before building a fallback link", () => {
    expect(isYouTubeVideoId("dQw4w9WgXcQ")).toBe(true);
    expect(isYouTubeVideoId("too-short")).toBe(false);
    expect(getYouTubeWatchUrl("dQw4w9WgXcQ")).toBe("https://youtu.be/dQw4w9WgXcQ");
    expect(getYouTubeWatchUrl("not-a-video-id")).toBeNull();
  });
});

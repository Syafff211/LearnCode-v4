import { describe, expect, it } from "vitest";

import {
  DEFAULT_INTRO_VIDEO_SRC,
  INTRO_VIDEO_SEEN_VALUE,
  hasSeenIntroVideo,
  isAllowedIntroSource,
  parseIntroFrequency,
  resolveIntroVideoSource,
  shouldShowIntroVideo,
} from "@/lib/intro-video";

describe("landing intro video source", () => {
  it("falls back to the bundled public/intro.mp4", () => {
    expect(resolveIntroVideoSource(undefined)).toBe(DEFAULT_INTRO_VIDEO_SRC);
    expect(resolveIntroVideoSource("")).toBe("/intro.mp4");
    expect(resolveIntroVideoSource("   ")).toBe("/intro.mp4");
  });

  it("accepts a site-relative path or an http(s) URL", () => {
    expect(resolveIntroVideoSource("/media/intro.mp4")).toBe("/media/intro.mp4");
    expect(resolveIntroVideoSource("  /intro.mp4  ")).toBe("/intro.mp4");
    expect(resolveIntroVideoSource("https://cdn.example.test/intro.mp4")).toBe(
      "https://cdn.example.test/intro.mp4",
    );
  });

  it.each([
    "javascript:alert(1)",
    "data:video/mp4;base64,AAAA",
    "//evil.example/intro.mp4",
    "file:///intro.mp4",
    "intro.mp4",
  ])("disables the intro for an unusable source %s", (value) => {
    expect(isAllowedIntroSource(value)).toBe(false);
    expect(resolveIntroVideoSource(value)).toBeNull();
  });
});

describe("landing intro video gating", () => {
  it("parses the frequency with a safe default", () => {
    expect(parseIntroFrequency("always")).toBe("always");
    expect(parseIntroFrequency("once")).toBe("once");
    expect(parseIntroFrequency("nonsense")).toBe("once");
    expect(parseIntroFrequency(null)).toBe("once");
  });

  it("shows the intro only until the visitor has watched it", () => {
    expect(hasSeenIntroVideo(null)).toBe(false);
    expect(hasSeenIntroVideo(INTRO_VIDEO_SEEN_VALUE)).toBe(true);

    expect(shouldShowIntroVideo(null, "once")).toBe(true);
    expect(shouldShowIntroVideo(INTRO_VIDEO_SEEN_VALUE, "once")).toBe(false);
  });

  it("always shows the intro when the frequency is always", () => {
    expect(shouldShowIntroVideo(INTRO_VIDEO_SEEN_VALUE, "always")).toBe(true);
  });

  it("shows the intro when storage is unavailable (value reads back null)", () => {
    expect(shouldShowIntroVideo(undefined)).toBe(true);
  });
});

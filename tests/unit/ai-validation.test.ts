import { describe, expect, it } from "vitest";

import { AI_DAILY_MESSAGE_LIMIT, aiRequestSchema } from "@/lib/validation/ai";
import { courseLevelLabel } from "@/content/types";

describe("aiRequestSchema", () => {
  it("requires a message for free chat", () => {
    const result = aiRequestSchema.safeParse({ action: "free_chat" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["message"]);
    }
  });

  it("requires code for explain, debug, and review modes", () => {
    for (const action of ["explain_code", "debug_code", "code_review"] as const) {
      const result = aiRequestSchema.safeParse({ action, message: "apa ini?" });
      expect(result.success).toBe(false);
    }
  });

  it("requires a lesson id for explain_lesson", () => {
    const invalid = aiRequestSchema.safeParse({ action: "explain_lesson" });
    expect(invalid.success).toBe(false);

    const valid = aiRequestSchema.safeParse({
      action: "explain_lesson",
      lessonId: "cf0e5a9a-9b0a-4f0e-8f2a-1b2c3d4e5f60",
    });
    expect(valid.success).toBe(true);
  });

  it("accepts a hint with code but no message", () => {
    const result = aiRequestSchema.safeParse({
      action: "hint",
      code: "const x = 1;",
      codeLanguage: "javascript",
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown keys instead of passing them through", () => {
    const result = aiRequestSchema.safeParse({
      action: "free_chat",
      message: "halo",
      role: "admin",
      quota: 999,
    });
    expect(result.success).toBe(false);
  });

  it("rejects oversized messages and code", () => {
    expect(
      aiRequestSchema.safeParse({ action: "free_chat", message: "a".repeat(4001) }).success,
    ).toBe(false);
    expect(
      aiRequestSchema.safeParse({
        action: "explain_code",
        code: "a".repeat(8001),
      }).success,
    ).toBe(false);
  });

  it("validates language and code language enums", () => {
    expect(
      aiRequestSchema.safeParse({ action: "free_chat", message: "halo", language: "fr" }).success,
    ).toBe(false);
    expect(
      aiRequestSchema.safeParse({
        action: "explain_code",
        code: "x",
        codeLanguage: "python",
      }).success,
    ).toBe(false);
  });

  it("exposes a finite daily limit for the UI", () => {
    expect(Number.isInteger(AI_DAILY_MESSAGE_LIMIT)).toBe(true);
    expect(AI_DAILY_MESSAGE_LIMIT).toBeGreaterThan(0);
  });
});

describe("content labels", () => {
  it("has Indonesian labels for every course level", () => {
    expect(courseLevelLabel.pemula).toBe("Pemula");
    expect(courseLevelLabel.menengah).toBe("Menengah");
    expect(courseLevelLabel.lanjutan).toBe("Lanjutan");
  });
});

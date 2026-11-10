import { describe, expect, it } from "vitest";

import { lessonInputSchema } from "@/lib/validation/admin";

const validLesson = {
  courseId: "cf0e5a9a-9b0a-4f0e-8f2a-1b2c3d4e5f60",
  title: "Lesson YouTube",
  slug: "lesson-youtube",
  summary: "Ringkasan materi lesson ini.",
  contentMd: "Materi yang cukup panjang untuk memenuhi batas minimum. ".repeat(2),
  objectives: "",
  estimatedMinutes: 20,
  required: true,
  status: "draft",
  codeLanguage: "html",
  codeFilename: "",
  codeCaption: "",
  code: "",
  exerciseTitle: "",
  exerciseBrief: "",
  exerciseHint: "",
  exerciseSteps: "",
  starterHtml: "",
  starterCss: "",
  starterJs: "",
  youtubeUrl: "",
  youtubeTitle: "",
  youtubeDescription: "",
};

describe("lesson YouTube metadata validation", () => {
  it("keeps video metadata optional", () => {
    expect(lessonInputSchema.safeParse(validLesson).success).toBe(true);
  });

  it("accepts a recognized YouTube URL and trims optional metadata", () => {
    const result = lessonInputSchema.safeParse({
      ...validLesson,
      youtubeUrl: "  https://youtu.be/dQw4w9WgXcQ  ",
      youtubeTitle: "  Judul video  ",
      youtubeDescription: "  Penjelasan singkat  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.youtubeUrl).toBe("https://youtu.be/dQw4w9WgXcQ");
      expect(result.data.youtubeTitle).toBe("Judul video");
      expect(result.data.youtubeDescription).toBe("Penjelasan singkat");
    }
  });

  it.each([
    "<iframe src=\"https://www.youtube.com/embed/dQw4w9WgXcQ\"></iframe>",
    "https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ",
    "https://youtube.com/watch?v=short",
  ])("rejects unsafe URL input %s", (youtubeUrl) => {
    const result = lessonInputSchema.safeParse({ ...validLesson, youtubeUrl });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "youtubeUrl")).toBe(true);
    }
  });

  it("requires a URL whenever video title or description is provided", () => {
    const result = lessonInputSchema.safeParse({
      ...validLesson,
      youtubeTitle: "Video tanpa URL",
    });
    expect(result.success).toBe(false);
  });
});

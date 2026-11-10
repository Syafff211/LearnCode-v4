import { describe, expect, it } from "vitest";

import {
  buildSystemPrompt,
  buildUserContent,
  conversationTitle,
  excerptLesson,
  type PromptInput,
} from "@/lib/ai/prompt";

const base: PromptInput = {
  action: "explain_code",
  language: "id",
  level: "pemula",
  lesson: null,
  message: "kenapa ini tidak jalan?",
  code: "console.log('halo')",
  codeLanguage: "javascript",
};

describe("buildSystemPrompt", () => {
  it("states that the tutor cannot execute code", () => {
    const prompt = buildSystemPrompt(base);
    expect(prompt).toContain("no code execution environment");
    expect(prompt).toContain("Never claim that you ran");
  });

  it("treats student content as untrusted", () => {
    const prompt = buildSystemPrompt(base);
    expect(prompt).toContain("<student_input>");
    expect(prompt).toContain("untrusted data");
  });

  it("forbids revealing secrets and inventing features", () => {
    const prompt = buildSystemPrompt(base);
    expect(prompt).toContain("API keys");
    expect(prompt).toContain("Never invent LearnCode features");
  });

  it("switches the response language", () => {
    expect(buildSystemPrompt({ ...base, language: "en" })).toContain("Respond in English");
    expect(buildSystemPrompt({ ...base, language: "id" })).toContain("bahasa Indonesia");
  });

  it("describes the active mode", () => {
    expect(buildSystemPrompt({ ...base, action: "debug_code" })).toContain(
      "Current mode: debug_code",
    );
    expect(buildSystemPrompt({ ...base, action: "practice_suggestions" })).toContain(
      "Current mode: practice_suggestions",
    );
  });

  it("sanitizes lesson titles so attributes cannot be broken", () => {
    const prompt = buildSystemPrompt({
      ...base,
      lesson: {
        courseTitle: 'HTML "Dasar" <script>',
        title: "Formulir & Label",
        summary: "Ringkasan.",
        contentExcerpt: "Isi.",
      },
    });
    expect(prompt).toContain('course="HTML Dasar script"');
    expect(prompt).not.toContain("<script>");
  });

  it("adapts instructions to the learner level", () => {
    expect(buildSystemPrompt({ ...base, level: "lanjutan" })).toContain(
      "The student is advanced",
    );
    expect(buildSystemPrompt({ ...base, level: "pemula" })).toContain("beginner");
  });
});

describe("buildUserContent", () => {
  it("wraps message and code in delimited blocks", () => {
    const content = buildUserContent(base);
    expect(content).toContain("<student_input>");
    expect(content).toContain("<student_code language=\"javascript\">");
    expect(content).toContain("kenapa ini tidak jalan?");
  });

  it("falls back to a neutral prompt when nothing is provided", () => {
    const content = buildUserContent({ ...base, message: "", code: "" });
    expect(content).toContain("Bantu saya memahami lesson ini.");
  });
});

describe("excerptLesson", () => {
  it("strips markdown fences and decorations", () => {
    const excerpt = excerptLesson("## Judul\n\n```html\n<p>Halo</p>\n```\n\nTeks **penting**.");
    expect(excerpt).not.toContain("```");
    expect(excerpt).not.toContain("##");
    expect(excerpt).toContain("Teks penting");
  });

  it("truncates long content with an ellipsis", () => {
    const excerpt = excerptLesson("kata ".repeat(2000), 100);
    expect(excerpt.length).toBeLessThanOrEqual(101);
    expect(excerpt.endsWith("…")).toBe(true);
  });
});

describe("conversationTitle", () => {
  it("uses the message, then the code, then the lesson title", () => {
    expect(conversationTitle({ ...base, message: "Apa itu flexbox?" })).toBe(
      "Apa itu flexbox?",
    );
    expect(conversationTitle({ ...base, message: "", code: "const a = 1;" })).toBe(
      "const a = 1;",
    );
    expect(
      conversationTitle({
        ...base,
        message: "",
        code: "",
        lesson: {
          courseTitle: "CSS",
          title: "Flexbox",
          summary: "",
          contentExcerpt: "",
        },
      }),
    ).toBe("Flexbox");
  });

  it("truncates to 60 characters and collapses whitespace", () => {
    const title = conversationTitle({ ...base, message: "  halo   dun ia  " });
    expect(title).toBe("halo dun ia");
    const long = conversationTitle({ ...base, message: "k".repeat(80) });
    expect(long.length).toBe(58);
    expect(long.endsWith("…")).toBe(true);
  });
});

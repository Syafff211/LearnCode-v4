import { z } from "zod";

export const AI_ACTIONS = [
  "free_chat",
  "explain_code",
  "debug_code",
  "hint",
  "code_review",
  "explain_lesson",
  "practice_suggestions",
] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

export const AI_DAILY_MESSAGE_LIMIT = 30;

export const aiRequestSchema = z
  .object({
    action: z.enum(AI_ACTIONS).optional(),
    message: z
      .string()
      .trim()
      .max(4000, "Pesan maksimal 4000 karakter.")
      .optional(),
    code: z
      .string()
      .trim()
      .max(8000, "Kode maksimal 8000 karakter.")
      .optional(),
    codeLanguage: z.enum(["html", "css", "javascript"]).optional(),
    lessonId: z.uuid("ID lesson tidak valid.").optional(),
    conversationId: z.uuid("ID percakapan tidak valid.").optional(),
    language: z.enum(["id", "en"]).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const action = value.action ?? "free_chat";
    const hasMessage = Boolean(value.message && value.message.length > 0);
    const hasCode = Boolean(value.code && value.code.length > 0);

    if (action === "free_chat" && !hasMessage) {
      ctx.addIssue({
        code: "custom",
        path: ["message"],
        message: "Tulis pertanyaan terlebih dahulu.",
      });
    }
    if ((action === "explain_code" || action === "debug_code" || action === "code_review") && !hasCode) {
      ctx.addIssue({
        code: "custom",
        path: ["code"],
        message: "Tempel kode yang ingin dianalisis.",
      });
    }
    if (action === "hint" && !hasCode && !hasMessage) {
      ctx.addIssue({
        code: "custom",
        path: ["message"],
        message: "Sertakan kode atau pertanyaan agar hint bisa relevan.",
      });
    }
    if (action === "explain_lesson" && !value.lessonId) {
      ctx.addIssue({
        code: "custom",
        path: ["lessonId"],
        message: "Pilih lesson yang ingin dijelaskan.",
      });
    }
  });

export type AiRequestInput = z.infer<typeof aiRequestSchema>;

export const aiActionLabels: Record<AiAction, string> = {
  free_chat: "Tanya AI Tutor",
  explain_code: "Jelaskan kode",
  debug_code: "Bantu debug",
  hint: "Beri hint",
  code_review: "Review kode",
  explain_lesson: "Jelaskan lesson",
  practice_suggestions: "Saran latihan",
};

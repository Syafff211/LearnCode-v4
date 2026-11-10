import { z } from "zod";

import { AI_FEATURE_KEYS, GROQ_ALLOWED_MODELS } from "@/lib/ai/features";
import { parseYouTubeVideoId } from "@/lib/youtube";

/**
 * Every admin payload is validated here, on the server, before it reaches the
 * database. The browser may render the same rules for convenience, but these
 * schemas are the authority.
 */

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug minimal 3 karakter.")
  .max(80, "Slug maksimal 80 karakter.")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (contoh: html-dasar).",
  );

const lines = (max: number) =>
  z
    .string()
    .default("")
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter((line) => line.length > 0),
    )
    .pipe(z.array(z.string().min(2, "Setiap baris minimal 2 karakter.").max(max)).max(12));

function checkbox(value: unknown): boolean {
  return value === "on" || value === "true" || value === "1";
}

function optionalText(max: number) {
  return z
    .string()
    .default("")
    .transform((value) => value.trim())
    .pipe(z.string().max(max));
}

export const courseStatusSchema = z.enum(["draft", "published", "archived"]);
export const courseLevelSchema = z.enum(["pemula", "menengah", "lanjutan"]);
export const languageSchema = z.enum(["id", "en"]);

export const courseInputSchema = z
  .object({
    title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(120, "Judul terlalu panjang."),
    slug: slugSchema,
    tagline: z.string().trim().min(5, "Tagline minimal 5 karakter.").max(160, "Tagline terlalu panjang."),
    description: z
      .string()
      .trim()
      .min(20, "Deskripsi minimal 20 karakter agar peserta tahu isi kursus.")
      .max(4000, "Deskripsi maksimal 4000 karakter."),
    level: courseLevelSchema,
    language: languageSchema,
    durationMinutes: z.coerce
      .number("Durasi harus berupa angka.")
      .int("Durasi harus bilangan bulat.")
      .min(0, "Durasi tidak boleh negatif.")
      .max(6000, "Durasi maksimal 6000 menit."),
    objectives: lines(200),
    passingScore: z.coerce
      .number("Nilai kelulusan harus berupa angka.")
      .int()
      .min(0)
      .max(100),
    requireAllLessons: z.boolean(),
    status: courseStatusSchema,
    position: z.coerce.number().int().min(0).max(999),
  })
  .strict();

export type CourseInput = z.infer<typeof courseInputSchema>;

export function parseCourseForm(formData: FormData) {
  return courseInputSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    tagline: formData.get("tagline"),
    description: formData.get("description"),
    level: formData.get("level"),
    language: formData.get("language"),
    durationMinutes: formData.get("durationMinutes"),
    objectives: formData.get("objectives") ?? "",
    passingScore: formData.get("passingScore"),
    requireAllLessons: checkbox(formData.get("requireAllLessons")),
    status: formData.get("status"),
    position: formData.get("position"),
  });
}

/** Extra rule checked before a course may go live. */
export function coursePublishBlockers(input: CourseInput): string[] {
  const blockers: string[] = [];
  if (input.description.length < 20) blockers.push("Deskripsi kursus belum memadai.");
  if (input.objectives.length === 0) {
    blockers.push("Tambahkan minimal satu tujuan pembelajaran sebelum publikasi.");
  }
  if (input.durationMinutes <= 0) blockers.push("Isi estimasi durasi kursus.");
  return blockers;
}

export const lessonStatusSchema = z.enum(["draft", "published", "archived"]);

export const lessonInputSchema = z
  .object({
    courseId: z.uuid("Pilih kursus induk."),
    title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(120),
    slug: slugSchema,
    summary: z.string().trim().min(5, "Ringkasan minimal 5 karakter.").max(280),
    contentMd: z
      .string()
      .trim()
      .min(80, "Isi lesson minimal 80 karakter agar layak dipelajari.")
      .max(20000, "Isi lesson maksimal 20000 karakter."),
    objectives: lines(160),
    estimatedMinutes: z.coerce
      .number("Estimasi harus berupa angka.")
      .int()
      .min(1, "Estimasi minimal 1 menit.")
      .max(600),
    required: z.boolean(),
    status: lessonStatusSchema,
    codeLanguage: z.enum(["html", "css", "javascript"]).optional(),
    codeFilename: optionalText(60),
    codeCaption: optionalText(160),
    code: optionalText(8000),
    exerciseTitle: optionalText(120),
    exerciseBrief: optionalText(600),
    exerciseHint: optionalText(400),
    exerciseSteps: lines(200),
    starterHtml: optionalText(8000),
    starterCss: optionalText(8000),
    starterJs: optionalText(8000),
    youtubeUrl: optionalText(500),
    youtubeTitle: optionalText(120),
    youtubeDescription: optionalText(500),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.youtubeUrl && !parseYouTubeVideoId(value.youtubeUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["youtubeUrl"],
        message: "Masukkan URL video YouTube yang valid (watch, youtu.be, Shorts, live, atau embed).",
      });
    }
    if (!value.youtubeUrl && (value.youtubeTitle || value.youtubeDescription)) {
      ctx.addIssue({
        code: "custom",
        path: ["youtubeUrl"],
        message: "Masukkan URL video sebelum mengisi judul atau deskripsi.",
      });
    }
  });

export type LessonInput = z.infer<typeof lessonInputSchema>;

export function parseLessonForm(formData: FormData) {
  const rawLanguage = formData.get("codeLanguage");
  return lessonInputSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    contentMd: formData.get("contentMd"),
    objectives: formData.get("objectives") ?? "",
    estimatedMinutes: formData.get("estimatedMinutes"),
    required: checkbox(formData.get("required")),
    status: formData.get("status"),
    codeLanguage:
      rawLanguage === "html" || rawLanguage === "css" || rawLanguage === "javascript"
        ? rawLanguage
        : undefined,
    codeFilename: formData.get("codeFilename") ?? "",
    codeCaption: formData.get("codeCaption") ?? "",
    code: formData.get("code") ?? "",
    exerciseTitle: formData.get("exerciseTitle") ?? "",
    exerciseBrief: formData.get("exerciseBrief") ?? "",
    exerciseHint: formData.get("exerciseHint") ?? "",
    exerciseSteps: formData.get("exerciseSteps") ?? "",
    starterHtml: formData.get("starterHtml") ?? "",
    starterCss: formData.get("starterCss") ?? "",
    starterJs: formData.get("starterJs") ?? "",
    youtubeUrl: formData.get("youtubeUrl") ?? "",
    youtubeTitle: formData.get("youtubeTitle") ?? "",
    youtubeDescription: formData.get("youtubeDescription") ?? "",
  });
}

export function lessonPublishBlockers(input: LessonInput): string[] {
  const blockers: string[] = [];
  if (input.contentMd.length < 80) blockers.push("Isi lesson belum cukup untuk dipublikasikan.");
  if (input.code.trim().length > 0 && !input.codeLanguage) {
    blockers.push("Pilih bahasa untuk contoh kode.");
  }
  return blockers;
}

export const quizInputSchema = z
  .object({
    courseId: z.uuid("Pilih kursus untuk quiz ini."),
    title: z.string().trim().min(3, "Judul quiz minimal 3 karakter.").max(120),
    description: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(1000),
    passingScore: z.coerce.number().int().min(0).max(100),
    required: z.boolean(),
  })
  .strict();

export function parseQuizForm(formData: FormData) {
  return quizInputSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description"),
    passingScore: formData.get("passingScore"),
    required: checkbox(formData.get("required")),
  });
}

const optionText = z.string().trim().min(1, "Opsi jawaban tidak boleh kosong.").max(300);

export const questionInputSchema = z
  .object({
    quizId: z.uuid("Quiz tidak valid."),
    prompt: z.string().trim().min(5, "Pertanyaan minimal 5 karakter.").max(1000),
    code: optionalText(4000),
    codeLanguage: z.enum(["html", "css", "javascript"]).optional(),
    options: z
      .array(z.object({ id: z.string().regex(/^[a-z0-9]{1,8}$/), text: optionText }))
      .min(2, "Minimal dua opsi jawaban.")
      .max(6, "Maksimal enam opsi jawaban."),
    correctOptionId: z.string().trim().min(1, "Pilih satu jawaban benar."),
    explanation: z.string().trim().min(10, "Penjelasan minimal 10 karakter.").max(1000),
    weight: z.coerce.number("Bobot harus berupa angka.").int().min(1).max(10),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = value.options.map((option) => option.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Opsi duplikat terdeteksi." });
    }
    if (!ids.includes(value.correctOptionId)) {
      ctx.addIssue({
        code: "custom",
        path: ["correctOptionId"],
        message: "Jawaban benar harus salah satu dari opsi yang tersedia.",
      });
    }
    const texts = value.options.map((option) => option.text.toLowerCase());
    if (new Set(texts).size !== texts.length) {
      ctx.addIssue({ code: "custom", path: ["options"], message: "Teks opsi tidak boleh sama." });
    }
  });

export function parseQuestionForm(formData: FormData) {
  const options: { id: string; text: string }[] = [];
  for (let index = 0; index < 6; index += 1) {
    const text = String(formData.get(`option-${index}`) ?? "").trim();
    if (!text) continue;
    const rawId = String(formData.get(`optionId-${index}`) ?? "").trim();
    const id = /^[a-z0-9]{1,8}$/.test(rawId) ? rawId : String.fromCharCode(97 + index);
    options.push({ id, text });
  }
  const rawLanguage = formData.get("codeLanguage");

  return questionInputSchema.safeParse({
    quizId: formData.get("quizId"),
    prompt: formData.get("prompt"),
    code: formData.get("code") ?? "",
    codeLanguage:
      rawLanguage === "html" || rawLanguage === "css" || rawLanguage === "javascript"
        ? rawLanguage
        : undefined,
    options,
    correctOptionId: formData.get("correctOptionId") ?? "",
    explanation: formData.get("explanation"),
    weight: formData.get("weight") ?? 1,
  });
}

export const reorderSchema = z
  .object({
    orderedIds: z.array(z.uuid("ID tidak valid.")).min(1).max(200),
  })
  .strict();

export const revokeCertificateSchema = z
  .object({
    certificateId: z.uuid("Sertifikat tidak valid."),
    reason: z
      .string()
      .trim()
      .min(10, "Alasan pencabutan minimal 10 karakter agar tercatat jelas.")
      .max(500, "Alasan maksimal 500 karakter."),
  })
  .strict();

export const suspendUserSchema = z
  .object({
    userId: z.uuid("Pengguna tidak valid."),
    reason: z
      .string()
      .trim()
      .min(5, "Alasan minimal 5 karakter.")
      .max(300, "Alasan maksimal 300 karakter."),
  })
  .strict();

export const aiSettingsInputSchema = z
  .object({
    enabled: z.boolean(),
    dailyMessageLimit: z.coerce.number().int().min(1).max(200),
    maxInputChars: z.coerce.number().int().min(400).max(20000),
    maxOutputTokens: z.coerce.number().int().min(100).max(4000),
    model: z.enum(GROQ_ALLOWED_MODELS),
    features: z
      .array(z.enum(AI_FEATURE_KEYS))
      .min(1, "Pilih minimal satu fitur AI.")
      .max(AI_FEATURE_KEYS.length),
    learningInstructions: z
      .string()
      .trim()
      .max(4000, "Instruksi maksimal 4000 karakter."),
  })
  .strict();

export function parseAiSettingsForm(formData: FormData) {
  const features = AI_FEATURE_KEYS.filter((key) => checkbox(formData.get(`feature-${key}`)));
  return aiSettingsInputSchema.safeParse({
    enabled: checkbox(formData.get("enabled")),
    dailyMessageLimit: formData.get("dailyMessageLimit"),
    maxInputChars: formData.get("maxInputChars"),
    maxOutputTokens: formData.get("maxOutputTokens"),
    model: formData.get("model"),
    features,
    learningInstructions: formData.get("learningInstructions") ?? "",
  });
}

export const platformSettingsInputSchema = z
  .object({
    platformName: z.string().trim().min(2, "Nama platform minimal 2 karakter.").max(60),
    shortDescription: z.string().trim().max(280, "Deskripsi maksimal 280 karakter."),
    logoUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => value === "" || /^https:\/\/\S+$/.test(value) || value.startsWith("/"),
        "URL logo harus https:// atau path internal yang diawali /.",
      ),
    faviconUrl: z
      .string()
      .trim()
      .max(500)
      .refine(
        (value) => value === "" || /^https:\/\/\S+$/.test(value) || value.startsWith("/"),
        "URL favicon harus https:// atau path internal yang diawali /.",
      ),
    defaultLanguage: languageSchema,
    certificateSignature: z.string().trim().min(2, "Tanda tangan minimal 2 karakter.").max(80),
    defaultPassingScore: z.coerce.number().int().min(0).max(100),
    contactEmail: z
      .string()
      .trim()
      .max(120)
      .refine(
        (value) => value === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),
        "Format email kontak tidak valid.",
      ),
    contactUrl: z
      .string()
      .trim()
      .max(300)
      .refine(
        (value) => value === "" || /^https:\/\/\S+$/.test(value),
        "URL kontak harus diawali https://.",
      ),
    maintenanceMode: z.boolean(),
    maintenanceMessage: z.string().trim().max(280, "Pesan maksimal 280 karakter."),
  })
  .strict();

export function parsePlatformSettingsForm(formData: FormData) {
  return platformSettingsInputSchema.safeParse({
    platformName: formData.get("platformName"),
    shortDescription: formData.get("shortDescription") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    faviconUrl: formData.get("faviconUrl") ?? "",
    defaultLanguage: formData.get("defaultLanguage"),
    certificateSignature: formData.get("certificateSignature"),
    defaultPassingScore: formData.get("defaultPassingScore"),
    contactEmail: formData.get("contactEmail") ?? "",
    contactUrl: formData.get("contactUrl") ?? "",
    maintenanceMode: checkbox(formData.get("maintenanceMode")),
    maintenanceMessage: formData.get("maintenanceMessage") ?? "",
  });
}

export const ADMIN_PAGE_SIZE = 15;

export const adminSearchSchema = z.object({
  q: z.string().trim().max(80).catch(""),
  status: z.string().trim().max(20).catch("all"),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

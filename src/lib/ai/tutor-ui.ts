import type { AiAction } from "@/lib/validation/ai";

export type TutorModeMeta = {
  action: AiAction;
  label: string;
  shortLabel: string;
  description: string;
  placeholder: string;
  requiresCode?: boolean;
  requiresLesson?: boolean;
};

export const TUTOR_MODES: TutorModeMeta[] = [
  {
    action: "free_chat",
    label: "Tanya",
    shortLabel: "Tanya",
    description: "Tanyakan apa saja seputar pemrograman.",
    placeholder: "Tanyakan HTML, CSS, atau JavaScript…",
  },
  {
    action: "explain_code",
    label: "Jelaskan kode",
    shortLabel: "Jelaskan kode",
    description: "Pahami cara kerja potongan kode.",
    placeholder: "Tempel kode atau tanyakan bagian yang ingin dipahami…",
    requiresCode: true,
  },
  {
    action: "debug_code",
    label: "Debug",
    shortLabel: "Debug",
    description: "Temukan dan perbaiki kesalahan kode.",
    placeholder: "Tempel kode yang error atau ceritakan masalahnya…",
    requiresCode: true,
  },
  {
    action: "hint",
    label: "Hint",
    shortLabel: "Hint",
    description: "Dapatkan petunjuk tanpa langsung diberikan jawaban.",
    placeholder: "Ceritakan latihan yang membuatmu buntu…",
  },
  {
    action: "code_review",
    label: "Review",
    shortLabel: "Review",
    description: "Evaluasi kode dan dapatkan saran perbaikan.",
    placeholder: "Bagian kode mana yang ingin dievaluasi?",
    requiresCode: true,
  },
  {
    action: "explain_lesson",
    label: "Jelaskan lesson",
    shortLabel: "Jelaskan lesson",
    description: "Pelajari materi dari lesson yang dipilih.",
    placeholder: "Bagian materi lesson mana yang ingin dipahami?",
    requiresLesson: true,
  },
  {
    action: "practice_suggestions",
    label: "Latihan",
    shortLabel: "Latihan",
    description: "Uji pemahaman melalui latihan pemrograman.",
    placeholder: "Topik atau level latihan apa yang kamu inginkan?",
  },
];

export const TUTOR_MODE_MAP: Record<AiAction, TutorModeMeta> = Object.fromEntries(
  TUTOR_MODES.map((entry) => [entry.action, entry]),
) as Record<AiAction, TutorModeMeta>;

export const TUTOR_PRIMARY_MODE_ACTIONS: readonly AiAction[] = [
  "free_chat",
  "explain_code",
  "debug_code",
  "hint",
  "practice_suggestions",
];

export const TUTOR_OVERFLOW_MODE_ACTIONS: readonly AiAction[] = [
  "code_review",
  "explain_lesson",
];

export const TUTOR_PRIMARY_MODES: TutorModeMeta[] = TUTOR_PRIMARY_MODE_ACTIONS.map(
  (action) => TUTOR_MODE_MAP[action],
);

export const TUTOR_OVERFLOW_MODES: TutorModeMeta[] = TUTOR_OVERFLOW_MODE_ACTIONS.map(
  (action) => TUTOR_MODE_MAP[action],
);

export const TUTOR_QUICK_REPLIES = [
  "Jelaskan flexbox",
  "Apa itu closure?",
  "Latihan JavaScript dasar",
  "Debug kode saya",
] as const;

export const TUTOR_LANGUAGES: { value: "id" | "en"; label: string; fullLabel: string }[] = [
  { value: "id", label: "ID", fullLabel: "Bahasa Indonesia" },
  { value: "en", label: "EN", fullLabel: "English" },
];

export type QuotaLevel = "normal" | "warning" | "exhausted";

export type QuotaStatus = {
  used: number;
  dailyLimit: number;
  remaining: number;
  percentage: number;
  level: QuotaLevel;
  summaryText: string;
  remainingText: string;
  warningText: string | null;
};

export function getQuotaStatus(rawUsed: number, rawDailyLimit: number): QuotaStatus {
  const dailyLimit = Math.max(1, Math.round(rawDailyLimit));
  const used = Math.min(dailyLimit, Math.max(0, Math.round(rawUsed)));
  const remaining = Math.max(0, dailyLimit - used);
  const percentage = Math.min(100, Math.round((used / dailyLimit) * 100));

  const lowByAbsolute = remaining > 0 && remaining <= 5;
  const lowByPercent = remaining > 0 && remaining / dailyLimit <= 0.2;

  let level: QuotaLevel = "normal";
  let warningText: string | null = null;

  if (remaining === 0) {
    level = "exhausted";
    warningText = `Kuota harian habis (${used}/${dailyLimit}). Riwayat tetap bisa dibaca.`;
  } else if (lowByAbsolute || lowByPercent) {
    level = "warning";
    warningText = `Sisa kuota menipis (${remaining} pesan tersisa hari ini).`;
  }

  return {
    used,
    dailyLimit,
    remaining,
    percentage,
    level,
    summaryText: `${used} dari ${dailyLimit} pesan digunakan`,
    remainingText: remaining === 0 ? "Kuota habis" : `Sisa ${remaining} pesan`,
    warningText,
  };
}

export const CONVERSATION_TITLE_MAX_LENGTH = 45;

export function truncateAtWordBoundary(
  value: string,
  maxLength = CONVERSATION_TITLE_MAX_LENGTH,
): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;

  const sliceLimit = Math.max(1, maxLength - 1);
  const candidate = normalized.slice(0, sliceLimit);
  const lastSpace = candidate.lastIndexOf(" ");
  const cut = lastSpace >= Math.floor(sliceLimit * 0.55) ? candidate.slice(0, lastSpace) : candidate;
  return `${cut.trimEnd()}…`;
}

const GENERIC_SINGLE_WORDS = new Set([
  "halo",
  "hai",
  "hello",
  "hi",
  "tolong",
  "bantu",
  "bantuan",
  "help",
  "tanya",
  "ask",
  "debug",
  "hint",
  "review",
  "jelaskan",
  "explain",
  "latihan",
  "practice",
  "kode",
  "code",
  "tes",
  "test",
  "percakapan baru",
]);

function countMeaningfulWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.replace(/[^\p{L}\p{N}]/gu, "").length > 0).length;
}

/**
 * Derive a descriptive <=45-char title for a conversation from message/code/lesson/mode context,
 * avoiding uninformative 1-word labels while preserving natural user phrasing.
 */
export function deriveDescriptiveTitle({
  rawTitle,
  message,
  code,
  codeLanguage,
  mode,
  lessonTitle,
}: {
  rawTitle?: string | null;
  message?: string | null;
  code?: string | null;
  codeLanguage?: "html" | "css" | "javascript";
  mode: AiAction;
  lessonTitle?: string | null;
}): string {
  const modeLabel = TUTOR_MODE_MAP[mode]?.label ?? "Tanya";
  const langLabel = codeLanguage === "javascript" ? "JavaScript" : codeLanguage?.toUpperCase() ?? "Kode";
  const cleanMessage = (message ?? "").replace(/\s+/g, " ").trim();
  const cleanRaw = (rawTitle ?? "").replace(/\s+/g, " ").trim();
  const cleanLesson = (lessonTitle ?? "").replace(/\s+/g, " ").trim();

  const baseCandidate = cleanMessage || cleanRaw;
  const wordCount = countMeaningfulWords(baseCandidate);
  const lower = baseCandidate.toLocaleLowerCase();

  if (baseCandidate && wordCount >= 2 && !GENERIC_SINGLE_WORDS.has(lower)) {
    return truncateAtWordBoundary(baseCandidate, CONVERSATION_TITLE_MAX_LENGTH);
  }

  if (cleanLesson) {
    return truncateAtWordBoundary(
      `${modeLabel}: ${cleanLesson}`,
      CONVERSATION_TITLE_MAX_LENGTH,
    );
  }

  if (code && code.trim().length > 0) {
    const firstNonEmptyLine =
      code
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean) ?? "";
    const snippet = firstNonEmptyLine.replace(/\s+/g, " ").slice(0, 24);
    const context = snippet ? `${modeLabel} ${langLabel}: ${snippet}` : `${modeLabel} kode ${langLabel}`;
    return truncateAtWordBoundary(context, CONVERSATION_TITLE_MAX_LENGTH);
  }

  if (baseCandidate && !GENERIC_SINGLE_WORDS.has(lower)) {
    return truncateAtWordBoundary(
      `${modeLabel}: ${baseCandidate}`,
      CONVERSATION_TITLE_MAX_LENGTH,
    );
  }

  return truncateAtWordBoundary(
    `${modeLabel} pemrograman`,
    CONVERSATION_TITLE_MAX_LENGTH,
  );
}

/**
 * Format an existing stored conversation title cleanly for the sidebar list
 * without modifying message contents or inventing fake data.
 */
export function formatConversationDisplayTitle(
  title: string,
  lessonTitle?: string | null,
): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (!clean) {
    return lessonTitle
      ? truncateAtWordBoundary(`Materi: ${lessonTitle}`, CONVERSATION_TITLE_MAX_LENGTH)
      : "Diskusi pemrograman";
  }

  const wordCount = countMeaningfulWords(clean);
  if (wordCount <= 1 && lessonTitle) {
    const cleanLesson = lessonTitle.replace(/\s+/g, " ").trim();
    if (clean.toLocaleLowerCase() !== cleanLesson.toLocaleLowerCase()) {
      return truncateAtWordBoundary(`${clean} · ${cleanLesson}`, CONVERSATION_TITLE_MAX_LENGTH);
    }
    return truncateAtWordBoundary(`Materi: ${cleanLesson}`, CONVERSATION_TITLE_MAX_LENGTH);
  }

  return truncateAtWordBoundary(clean, CONVERSATION_TITLE_MAX_LENGTH);
}

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const dateShortFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Jakarta",
});

export function formatConversationActivity(isoValue: string, now = new Date()): string {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "—";

  const targetDay = dayKeyFormatter.format(date);
  const todayDay = dayKeyFormatter.format(now);
  if (targetDay === todayDay) {
    return `Hari ini · ${timeFormatter.format(date)}`;
  }

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (targetDay === dayKeyFormatter.format(yesterday)) {
    return `Kemarin · ${timeFormatter.format(date)}`;
  }

  return dateShortFormatter.format(date);
}

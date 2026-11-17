import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/ai-tutor",
}));

import { TutorChat } from "@/components/ai/tutor-chat";
import { TutorComposer } from "@/components/ai/tutor-composer";
import { TutorConversationSidebar } from "@/components/ai/tutor-conversation-sidebar";
import { TutorMessageList } from "@/components/ai/tutor-message-list";
import { TutorModeToolbar } from "@/components/ai/tutor-mode-toolbar";
import {
  CONVERSATION_TITLE_MAX_LENGTH,
  TUTOR_LANGUAGES,
  TUTOR_MODES,
  TUTOR_OVERFLOW_MODES,
  TUTOR_PRIMARY_MODES,
  TUTOR_QUICK_REPLIES,
  deriveDescriptiveTitle,
  formatConversationActivity,
  formatConversationDisplayTitle,
  getQuotaStatus,
} from "@/lib/ai/tutor-ui";

describe("AI Tutor UI metadata & helpers", () => {
  it("defines 5 primary modes and 2 overflow modes with descriptions and placeholders", () => {
    expect(TUTOR_MODES).toHaveLength(7);
    expect(TUTOR_PRIMARY_MODES.map((m) => m.action)).toEqual([
      "free_chat",
      "explain_code",
      "debug_code",
      "hint",
      "practice_suggestions",
    ]);
    expect(TUTOR_OVERFLOW_MODES.map((m) => m.action)).toEqual([
      "code_review",
      "explain_lesson",
    ]);
    for (const mode of TUTOR_MODES) {
      expect(mode.label.trim().length).toBeGreaterThan(0);
      expect(mode.description.trim().length).toBeGreaterThan(10);
      expect(mode.placeholder.trim().length).toBeGreaterThan(10);
    }
  });

  it("provides 4 concise quick-replies and compact ID/EN language labels", () => {
    expect(TUTOR_QUICK_REPLIES).toEqual([
      "Jelaskan flexbox",
      "Apa itu closure?",
      "Latihan JavaScript dasar",
      "Debug kode saya",
    ]);
    expect(TUTOR_LANGUAGES).toEqual([
      { value: "id", label: "ID", fullLabel: "Bahasa Indonesia" },
      { value: "en", label: "EN", fullLabel: "English" },
    ]);
  });

  it("calculates quota status and warning thresholds accurately", () => {
    const normal = getQuotaStatus(5, 30);
    expect(normal.summaryText).toBe("5 dari 30 pesan digunakan");
    expect(normal.remainingText).toBe("Sisa 25 pesan");
    expect(normal.level).toBe("normal");
    expect(normal.warningText).toBeNull();

    const twentyPct = getQuotaStatus(24, 30);
    expect(twentyPct.remaining).toBe(6);
    expect(twentyPct.level).toBe("warning");
    expect(twentyPct.warningText).toContain("6 pesan");

    const fiveLeft = getQuotaStatus(95, 100);
    expect(fiveLeft.level).toBe("warning");

    const exhausted = getQuotaStatus(30, 30);
    expect(exhausted.level).toBe("exhausted");
    expect(exhausted.remaining).toBe(0);
    expect(exhausted.percentage).toBe(100);
    expect(exhausted.warningText).toContain("30/30");
  });

  it("derives descriptive <=45 char conversation titles without single-word ambiguity", () => {
    const fromGenericHello = deriveDescriptiveTitle({
      rawTitle: "halo",
      message: "halo",
      code: "<div class='card'></div>",
      codeLanguage: "html",
      mode: "explain_code",
    });
    expect(fromGenericHello).toContain("Jelaskan kode");
    expect(fromGenericHello.length).toBeLessThanOrEqual(CONVERSATION_TITLE_MAX_LENGTH);

    const fromLesson = deriveDescriptiveTitle({
      rawTitle: "tolong",
      message: "tolong",
      mode: "explain_lesson",
      lessonTitle: "Membuat Layout Flexbox Responsif",
    });
    expect(fromLesson).toContain("Jelaskan lesson");
    expect(fromLesson.length).toBeLessThanOrEqual(CONVERSATION_TITLE_MAX_LENGTH);

    const longPrompt = deriveDescriptiveTitle({
      rawTitle: "Bagaimana cara kerja CSS Grid dan Flexbox ketika digunakan bersamaan pada halaman responsif?",
      message: "Bagaimana cara kerja CSS Grid dan Flexbox ketika digunakan bersamaan pada halaman responsif?",
      mode: "free_chat",
    });
    expect(longPrompt.length).toBeLessThanOrEqual(CONVERSATION_TITLE_MAX_LENGTH);
    expect(longPrompt.endsWith("…")).toBe(true);

    const sidebarSingleWord = formatConversationDisplayTitle("Flexbox", "CSS Flexbox Dasar");
    expect(sidebarSingleWord).toBe("Flexbox · CSS Flexbox Dasar");
    expect(sidebarSingleWord.length).toBeLessThanOrEqual(CONVERSATION_TITLE_MAX_LENGTH);
  });

  it("formats conversation activity timestamps in Indonesian", () => {
    const now = new Date("2026-11-17T08:30:00.000Z");
    expect(formatConversationActivity("2026-11-17T05:15:00.000Z", now)).toContain("Hari ini");
    expect(formatConversationActivity("2026-11-16T10:00:00.000Z", now)).toContain("Kemarin");
    expect(formatConversationActivity("2026-11-01T10:00:00.000Z", now)).toContain("Nov");
  });
});

describe("AI Tutor SSR components", () => {
  it("renders streamlined TutorChat with progressive disclosure, single quota badge, and no fullscreen loader", () => {
    const html = renderToStaticMarkup(
      React.createElement(TutorChat, {
        initialUsed: 27,
        dailyLimit: 30,
        modelLabel: "llama 3.3 70b versatile",
        lessonOptions: [
          { id: "lesson-1", title: "Flexbox Dasar", courseTitle: "CSS Dasar" },
        ],
        initialConversations: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            title: "Perbedaan Flexbox dan CSS Grid untuk layout",
            updated_at: "2026-11-17T05:00:00.000Z",
            lesson_id: null,
          },
        ],
      }),
    );

    expect(html).toContain("LearnCode AI");
    expect(html).toContain("AI Tutor");
    expect(html).toContain("h-12");
    expect(html).toContain("Lainnya");
    expect(html).toContain("Lesson");
    expect(html).toContain("ID");
    expect(html).toContain("EN");
    expect(html).toContain("Bahasa jawaban AI");
    expect(html).toContain("Apa yang ingin kamu pelajari hari ini?");
    expect(html).toContain("Jelaskan flexbox");
    expect(html).toContain("AI bisa keliru, periksa kembali jawabannya.");
    expect(html).toContain("Cari riwayat");
    expect(html).toContain("Riwayat hanya bisa diakses akunmu");
    // Removed clutter
    expect(html).not.toContain("Tanyakan sesuatu, pahami kode");
    expect(html).not.toContain("Riwayat percakapan hanya dapat diakses oleh akunmu.");
    expect(html).not.toContain("Enter kirim · Shift+Enter baris baru");
    // Single quota display ("27/30") and single "+ Baru" action
    expect(html.match(/27\/30/g)?.length).toBe(1);
    expect(html.match(/<span>Baru<\/span>/g)?.length).toBe(1);
    // Never renders fullscreen global loading screen
    expect(html).not.toContain('data-loading-screen="true"');
    expect(html).not.toContain("/loading.gif");
  });

  it("renders TutorModeToolbar with 5 primary chips, Lainnya menu, and external help button", () => {
    const html = renderToStaticMarkup(
      React.createElement(TutorModeToolbar, {
        mode: "free_chat",
        disabled: false,
        onModeChange: () => {},
      }),
    );

    expect(html).toContain("Tanya");
    expect(html).toContain("Jelaskan kode");
    expect(html).toContain("Debug");
    expect(html).toContain("Hint");
    expect(html).toContain("Latihan");
    expect(html).toContain("Lainnya");
    expect(html).toContain('aria-label="Panduan semua mode AI Tutor"');
    expect(html).toContain("bg-gradient-to-l from-canvas");
  });

  it("renders readable user & AI messages with icon-only copy controls, code copy, and safe tables", () => {
    const html = renderToStaticMarkup(
      React.createElement(TutorMessageList, {
        messages: [
          {
            id: "u1",
            role: "user",
            content: "Apa bedanya padding dan margin?",
            created_at: "2026-11-17T05:00:00.000Z",
          },
          {
            id: "a1",
            role: "assistant",
            content:
              "## Perbedaan Singkat\n\n| Properti | Fungsi |\n| --- | --- |\n| padding | Ruang dalam |\n\n```css\n.box { padding: 16px; }\n```",
            created_at: "2026-11-17T05:00:02.000Z",
          },
        ],
        error: null,
        loading: false,
        copiedId: null,
        forceScrollVersion: 0,
        canQuickReply: true,
        onCopy: () => {},
        onRetry: () => {},
        onDismissError: () => {},
        onQuickReply: () => {},
      }),
    );

    expect(html).toContain("Kamu");
    expect(html).toContain("LearnCode AI");
    expect(html).toContain('aria-label="Salin pesan kamu"');
    expect(html).toContain('aria-label="Salin jawaban AI Tutor"');
    expect(html).toContain("Salin kode");
    expect(html).toContain("CSS");
    expect(html).toContain("<table");
  });

  it("disables textarea and Send in TutorComposer when quota is exhausted or textarea is empty", () => {
    const exhaustedHtml = renderToStaticMarkup(
      React.createElement(TutorComposer, {
        message: "",
        onMessageChange: () => {},
        onSubmit: () => {},
        mode: "free_chat",
        streaming: false,
        onStop: () => {},
        aiConfigured: true,
        used: 30,
        dailyLimit: 30,
        showCode: false,
        onToggleCode: () => {},
        code: "",
        onCodeChange: () => {},
        codeLanguage: "html",
        onCodeLanguageChange: () => {},
        lessonId: null,
        lessonOptions: [],
        onLessonChange: () => {},
        language: "id",
        onLanguageChange: () => {},
        inputRef: { current: null },
        formError: null,
      }),
    );

    expect(exhaustedHtml).toContain("Kuota harian habis (30/30)");
    expect(exhaustedHtml).toMatch(/<textarea[^>]*disabled=""/);
    expect(exhaustedHtml).toMatch(/<button[^>]*disabled=""[^>]*type="submit"/);

    const emptyMessageHtml = renderToStaticMarkup(
      React.createElement(TutorComposer, {
        message: "   ",
        onMessageChange: () => {},
        onSubmit: () => {},
        mode: "debug_code",
        streaming: false,
        onStop: () => {},
        aiConfigured: true,
        used: 3,
        dailyLimit: 30,
        showCode: false,
        onToggleCode: () => {},
        code: "",
        onCodeChange: () => {},
        codeLanguage: "javascript",
        onCodeLanguageChange: () => {},
        lessonId: null,
        lessonOptions: [{ id: "l1", title: "Variabel", courseTitle: "JS" }],
        onLessonChange: () => {},
        language: "id",
        onLanguageChange: () => {},
        formError: null,
      }),
    );

    expect(emptyMessageHtml).toContain("Tempel kode yang error atau ceritakan masalahnya…");
    expect(emptyMessageHtml).toContain("Lesson");
    expect(emptyMessageHtml).toContain("ID");
    expect(emptyMessageHtml).toContain("EN");
    expect(emptyMessageHtml).toMatch(/<button[^>]*disabled=""[^>]*type="submit"/);
  });

  it("renders sidebar empty search state, + Baru button, and lock tooltip cleanly", () => {
    const html = renderToStaticMarkup(
      React.createElement(TutorConversationSidebar, {
        idPrefix: "test",
        conversations: [],
        activeId: null,
        search: "flexbox",
        loading: false,
        error: null,
        onSearch: () => {},
        onSelect: () => {},
        onNew: () => {},
        onOpenRename: () => {},
        onOpenDelete: () => {},
      }),
    );
    expect(html).toContain("Tidak ada percakapan yang cocok");
    expect(html).toContain("Cari riwayat");
    expect(html).toContain("Baru");
    expect(html).toContain("Riwayat hanya bisa diakses akunmu");
  });
});

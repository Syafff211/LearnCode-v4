import type { Metadata } from "next";

import { TutorChat, type TutorConversation } from "@/components/ai/tutor-chat";
import { getAiSettings } from "@/lib/ai/settings";
import { requireProfile } from "@/lib/auth";
import { getTutorLessonOptions } from "@/lib/data/courses";
import { isAIConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Tutor",
  description:
    "Tanya, debug, minta hint, atau review kode dengan AI Tutor LearnCode.",
};

export default async function AiTutorPage() {
  const { user, profile, supabase } = await requireProfile("/ai-tutor");

  const today = new Date().toISOString().slice(0, 10);
  const [aiSettings, conversationsRes, usageRes, lessonOptions] = await Promise.all([
    getAiSettings(),
    supabase
      .from("ai_conversations")
      .select("id, title, updated_at, lesson_id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("ai_usage")
      .select("message_count")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle(),
    getTutorLessonOptions(),
  ]);

  const conversations: TutorConversation[] = (conversationsRes.data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    updated_at: row.updated_at as string,
    lesson_id: (row.lesson_id as string | null) ?? null,
  }));

  const modelLabel = aiSettings.model.split("/").at(-1)?.replaceAll("-", " ") ?? "Groq model";

  return (
    <div className="h-[calc(100dvh-3.8125rem)] min-h-[28rem] overflow-hidden">
      <TutorChat
        initialConversations={conversations}
        lessonOptions={lessonOptions}
        defaultLanguage={profile.preferred_language === "en" ? "en" : "id"}
        initialUsed={Number(usageRes.data?.message_count ?? 0)}
        dailyLimit={aiSettings.dailyMessageLimit}
        aiConfigured={isAIConfigured() && aiSettings.enabled}
        modelLabel={modelLabel}
      />
    </div>
  );
}

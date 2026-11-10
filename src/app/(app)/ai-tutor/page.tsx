import type { Metadata } from "next";

import { TutorChat, type TutorConversation, type TutorLessonOption } from "@/components/ai/tutor-chat";
import { getAiSettings } from "@/lib/ai/settings";
import { requireProfile } from "@/lib/auth";
import { getCatalogCourses } from "@/lib/data/courses";
import { isAIConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Tutor",
  description:
    "Tanya, debug, minta hint, atau review kode dengan AI Tutor LearnCode.",
};

export default async function AiTutorPage() {
  const { user, profile } = await requireProfile("/ai-tutor");
  const supabase = await createSupabaseServerClient();
  const aiSettings = await getAiSettings();

  const today = new Date().toISOString().slice(0, 10);
  const [conversationsRes, usageRes, courses] = await Promise.all([
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
    getCatalogCourses(),
  ]);

  const conversations: TutorConversation[] = (conversationsRes.data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    updated_at: row.updated_at as string,
    lesson_id: (row.lesson_id as string | null) ?? null,
  }));

  const lessonOptions: TutorLessonOption[] = courses.flatMap((course) =>
    course.lessons
      .filter((lesson) => Boolean(lesson.id))
      .map((lesson) => ({
        id: lesson.id as string,
        title: lesson.title,
        courseTitle: course.title,
      })),
  );

  const modelLabel = aiSettings.model.split("/").at(-1)?.replaceAll("-", " ") ?? "Groq model";

  return (
    <div className="h-[calc(100dvh-3.75rem)] min-h-[30rem] overflow-hidden">
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonWorkspaceView } from "@/components/learning/lesson-workspace-view";
import { findLessonInContent } from "@/content";
import { getAiSettings } from "@/lib/ai/settings";
import { profileLanguage, requireProfile } from "@/lib/auth";
import { getLessonWorkspace } from "@/lib/data/learning";
import { isAIConfigured } from "@/lib/env";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ lessonSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonSlug } = await params;
  const found = findLessonInContent(lessonSlug);
  if (!found) return { title: "Lesson tidak ditemukan" };
  return {
    title: `${found.lesson.title} — ${found.course.title}`,
    description: found.lesson.summary,
  };
}

export default async function LearnLessonPage({ params }: PageProps) {
  const { lessonSlug } = await params;
  const { user, profile, supabase } = await requireProfile(`/learn/${lessonSlug}`);
  const aiSettings = await getAiSettings();
  const lesson = await getLessonWorkspace(user.id, lessonSlug);
  if (!lesson) notFound();

  const contentHtml = await renderMarkdown(lesson.contentMd);

  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("message_count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  const nextHref = lesson.nextLessonSlug ? `/learn/${lesson.nextLessonSlug}` : null;
  const previousHref = lesson.previousLessonSlug ? `/learn/${lesson.previousLessonSlug}` : null;
  const quizHref = lesson.quizId ? `/courses/${lesson.course.slug}/quiz` : null;
  const quizAttempted =
    lesson.eligibility.requirements.find((requirement) => requirement.key === "quiz")?.met ?? false;

  return (
    <LessonWorkspaceView
      lesson={lesson}
      contentHtml={contentHtml}
      nextHref={nextHref}
      previousHref={previousHref}
      quizHref={quizHref}
      quizAttempted={quizAttempted}
      certificateNumber={lesson.certificate?.certificate_number ?? null}
      tutor={{
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        defaultLanguage: profileLanguage(profile),
        initialUsed: Number(usage?.message_count ?? 0),
        dailyLimit: aiSettings.dailyMessageLimit,
        aiConfigured: isAIConfigured() && aiSettings.enabled,
      }}
    />
  );
}

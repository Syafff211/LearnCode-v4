import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalogCourses, getCourseSummary } from "@/lib/data/courses";
import type {
  CourseProgressState,
  CourseSummary,
  DashboardData,
  LessonMeta,
  NextStepSuggestion,
  RecentActivity,
} from "@/lib/data/types";
import {
  evaluateCourseCompletion,
  type CompletionEvaluation,
  type QuizAttemptSummary,
} from "@/lib/services/completion";
import { isYouTubeVideoId } from "@/lib/youtube";

type AttemptRow = {
  course_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  created_at: string;
};

type CertificateRow = {
  course_id: string;
  certificate_number: string;
  course_title_snapshot: string;
  final_score: number;
  issued_at: string;
};

type QuizMeta = {
  id: string;
  course_id: string;
  title: string;
  passing_score: number;
  required: boolean;
};

export type LearningLesson = {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  summary: string;
  contentMd: string;
  codeExample: {
    language?: string;
    filename?: string;
    caption?: string;
    code?: string;
  };
  exercise: {
    title?: string;
    brief?: string;
    steps?: string[];
    hint?: string;
    starter?: { html?: string; css?: string; js?: string };
  };
  youtubeVideo: {
    videoId: string;
    title: string | null;
    description: string | null;
  } | null;
  position: number;
  estimatedMinutes: number;
  course: CourseSummary;
  siblings: LessonMeta[];
  completedLessonIds: string[];
  completed: boolean;
  nextLessonSlug: string | null;
  previousLessonSlug: string | null;
  quizId: string | null;
  quizPassingScore: number | null;
  certificate: CertificateRow | null;
  eligibility: CompletionEvaluation;
};

async function getUserSupabase() {
  return createSupabaseServerClient();
}

async function getQuizMetaMap(): Promise<Map<string, QuizMeta>> {
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("quizzes")
      .select("id, course_id, title, passing_score, required");
    if (error || !data) return new Map();
    const map = new Map<string, QuizMeta>();
    for (const row of data) {
      map.set(row.course_id as string, {
        id: row.id as string,
        course_id: row.course_id as string,
        title: row.title as string,
        passing_score: Number(row.passing_score),
        required: row.required !== false,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

function progressState(input: {
  course: CourseSummary;
  completedLessonIds: string[];
  attempts: AttemptRow[];
  quiz: QuizMeta | undefined;
  certificate: CertificateRow | undefined;
  lastActivityAt: string | null;
  lastCompletedLessonSlug?: string | null;
}): CourseProgressState {
  const completed = new Set(input.completedLessonIds);
  const totalLessons = input.course.lessons.length;
  const completedCount = input.course.lessons.filter((lesson) =>
    completed.has(lesson.slug),
  ).length;
  const attempts = input.attempts;
  const bestScore =
    attempts.length === 0 ? null : Math.max(...attempts.map((attempt) => attempt.score));

  return {
    course: input.course,
    completedLessonIds: input.completedLessonIds,
    completedCount,
    totalLessons,
    percent: totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100),
    attemptsCount: attempts.length,
    bestScore,
    quizId: input.quiz?.id ?? null,
    quizTitle: input.quiz?.title ?? null,
    quizPassingScore: input.quiz?.passing_score ?? null,
    certificate: input.certificate
      ? {
          certificateNumber: input.certificate.certificate_number,
          issuedAt: input.certificate.issued_at,
          finalScore: input.certificate.final_score,
        }
      : null,
    lastActivityAt: input.lastActivityAt,
    lastCompletedLessonSlug: input.lastCompletedLessonSlug ?? null,
  };
}

export async function getUserCourseState(
  userId: string,
  courseSlug: string,
): Promise<CourseProgressState | null> {
  const course = await getCourseSummary(courseSlug);
  if (!course || !course.id) return null;

  const supabase = await getUserSupabase();

  const [progressRes, attemptsRes, certificateRes, quizzes] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", userId)
      .eq("course_id", course.id),
    supabase
      .from("quiz_attempts")
      .select("course_id, quiz_id, score, passed, created_at")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("certificates")
      .select("course_id, certificate_number, course_title_snapshot, final_score, issued_at")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .maybeSingle(),
    getQuizMetaMap(),
  ]);

  const progressRows = (progressRes.data ?? []) as { lesson_id: string; completed_at: string }[];
  const completedSlugs = progressRows
    .map((row) => course.lessons.find((lesson) => lesson.id === row.lesson_id)?.slug)
    .filter((slug): slug is string => Boolean(slug));
  const attempts = (attemptsRes.data ?? []) as AttemptRow[];
  const certificate = (certificateRes.data as CertificateRow | null) ?? null;
  const lastActivityAt =
    [...progressRows.map((row) => row.completed_at), ...attempts.map((row) => row.created_at)]
      .sort()
      .at(-1) ?? null;

  const sortedProgress = [...progressRows].sort((a, b) =>
    b.completed_at.localeCompare(a.completed_at),
  );
  const lastCompletedSlug =
    course.lessons.find((lesson) => lesson.id === sortedProgress[0]?.lesson_id)?.slug ?? null;

  return progressState({
    course,
    completedLessonIds: completedSlugs,
    attempts,
    quiz: quizzes.get(course.id),
    certificate: certificate ?? undefined,
    lastActivityAt,
    lastCompletedLessonSlug: lastCompletedSlug,
  });
}

export async function getLessonWorkspace(
  userId: string,
  lessonSlug: string,
): Promise<LearningLesson | null> {
  const supabase = await getUserSupabase();

  const { data: lessonRow, error } = await supabase
    .from("lessons")
    .select(
      "id, course_id, slug, title, summary, content_md, code_example, exercise, youtube_video_id, youtube_video_title, youtube_video_description, position, estimated_minutes",
    )
    .eq("slug", lessonSlug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !lessonRow) return null;

  const course = await getCourseSummary(
    // Find the course slug through the course row (lessons only carry id)
    await (async () => {
      const { data } = await supabase
        .from("courses")
        .select("slug")
        .eq("id", lessonRow.course_id as string)
        .maybeSingle();
      return (data?.slug as string | undefined) ?? "";
    })(),
  );
  if (!course || !course.id) return null;

  const [progressRes, quizzes, certificateRes, attemptsRes] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("course_id", course.id),
    getQuizMetaMap(),
    supabase
      .from("certificates")
      .select("course_id, certificate_number, course_title_snapshot, final_score, issued_at")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .maybeSingle(),
    supabase
      .from("quiz_attempts")
      .select("course_id, quiz_id, score, passed, created_at")
      .eq("user_id", userId)
      .eq("course_id", course.id),
  ]);

  const completedIds = ((progressRes.data ?? []) as { lesson_id: string }[]).map(
    (row) => row.lesson_id,
  );
  const completedSlugs = course.lessons
    .filter((lesson) => lesson.id && completedIds.includes(lesson.id))
    .map((lesson) => lesson.slug);

  const quiz = quizzes.get(course.id);
  const attempts = ((attemptsRes.data ?? []) as AttemptRow[]).map(
    (attempt): QuizAttemptSummary => ({ score: attempt.score, passed: attempt.passed }),
  );
  // Completion counts only required lessons; the progress bar still shows all
  // published lessons so learners can see optional material too.
  const lessonsRequired = course.requireAllLessons !== false;
  const requiredLessons = lessonsRequired
    ? course.lessons.filter((item) => item.required !== false)
    : [];
  const completedRequired = requiredLessons
    .filter((item) => item.id && completedIds.includes(item.id))
    .map((item) => item.slug);

  const eligibility = evaluateCourseCompletion({
    totalLessons: requiredLessons.length,
    completedLessonIds: completedRequired,
    quizExists: Boolean(quiz),
    attempts,
    passingScore: course.passingScore,
    lessonsRequired,
    quizRequired: Boolean(quiz && quiz.required),
  });

  const index = course.lessons.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index === -1) return null;

  return {
    id: lessonRow.id as string,
    courseId: lessonRow.course_id as string,
    slug: lessonRow.slug as string,
    title: lessonRow.title as string,
    summary: lessonRow.summary as string,
    contentMd: lessonRow.content_md as string,
    codeExample: (lessonRow.code_example ?? {}) as LearningLesson["codeExample"],
    exercise: (lessonRow.exercise ?? {}) as LearningLesson["exercise"],
    youtubeVideo: isYouTubeVideoId(lessonRow.youtube_video_id)
      ? {
          videoId: lessonRow.youtube_video_id,
          title: (lessonRow.youtube_video_title as string | null) ?? null,
          description: (lessonRow.youtube_video_description as string | null) ?? null,
        }
      : null,
    position: Number(lessonRow.position),
    estimatedMinutes: Number(lessonRow.estimated_minutes),
    course,
    siblings: course.lessons,
    completedLessonIds: completedSlugs,
    completed: completedSlugs.includes(lessonSlug),
    nextLessonSlug: course.lessons[index + 1]?.slug ?? null,
    previousLessonSlug: course.lessons[index - 1]?.slug ?? null,
    quizId: quiz?.id ?? null,
    quizPassingScore: quiz?.passing_score ?? null,
    certificate: (certificateRes.data as CertificateRow | null) ?? null,
    eligibility,
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const courses = await getCatalogCourses();
  const supabase = await getUserSupabase();

  const [progressRes, attemptsRes, certificatesRes, quizzes] = await Promise.all([
    supabase
      .from("lesson_progress")
      .select("lesson_id, course_id, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
    supabase
      .from("quiz_attempts")
      .select("course_id, quiz_id, score, passed, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("certificates")
      .select("course_id, certificate_number, course_title_snapshot, final_score, issued_at")
      .eq("user_id", userId)
      .order("issued_at", { ascending: false }),
    getQuizMetaMap(),
  ]);

  const progressRows = (progressRes.data ?? []) as {
    lesson_id: string;
    course_id: string;
    completed_at: string;
  }[];
  const attempts = (attemptsRes.data ?? []) as AttemptRow[];
  const certificates = (certificatesRes.data ?? []) as CertificateRow[];

  const states: CourseProgressState[] = courses
    .filter((course) => course.id)
    .map((course) => {
      const courseProgress = progressRows.filter((row) => row.course_id === course.id);
      const completedSlugs = courseProgress
        .map((row) => course.lessons.find((lesson) => lesson.id === row.lesson_id)?.slug)
        .filter((slug): slug is string => Boolean(slug));
      const courseAttempts = attempts.filter((attempt) => attempt.course_id === course.id);
      const certificate = certificates.find((row) => row.course_id === course.id);
      const activityDates = [
        ...courseProgress.map((row) => row.completed_at),
        ...courseAttempts.map((row) => row.created_at),
      ];

      const sortedCourseProgress = [...courseProgress].sort((a, b) =>
        b.completed_at.localeCompare(a.completed_at),
      );
      const lastCompletedSlug =
        course.lessons.find(
          (lesson) => lesson.id === sortedCourseProgress[0]?.lesson_id,
        )?.slug ?? null;

      return progressState({
        course,
        completedLessonIds: completedSlugs,
        attempts: courseAttempts,
        quiz: quizzes.get(course.id as string),
        certificate,
        lastActivityAt: activityDates.sort().at(-1) ?? null,
        lastCompletedLessonSlug: lastCompletedSlug,
      });
    });

  const inProgress = states.filter(
    (state) =>
      !state.certificate && (state.completedCount > 0 || state.attemptsCount > 0),
  );
  const completed = states.filter((state) => state.certificate);

  // Recommend the next concrete step, based on real progress.
  let recommended: NextStepSuggestion | null = null;
  const lastActive = [...inProgress].sort((a, b) =>
    (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""),
  )[0];

  if (lastActive) {
    const completedSet = new Set(lastActive.completedLessonIds);
    const lastCompletedIndex = lastActive.course.lessons.findIndex(
      (lesson) => lesson.slug === lastActive.lastCompletedLessonSlug,
    );
    const nextAfterLast = lastActive.course.lessons
      .slice(lastCompletedIndex + 1)
      .find((lesson) => !completedSet.has(lesson.slug));
    const nextLesson =
      nextAfterLast ?? lastActive.course.lessons.find((lesson) => !completedSet.has(lesson.slug));

    if (nextLesson) {
      recommended = {
        kind: "lesson",
        href: `/learn/${nextLesson.slug}`,
        title: nextLesson.title,
        context: lastActive.course.title,
        reason: "continue",
      };
    } else if (lastActive.quizId) {
      const passed =
        lastActive.bestScore !== null && lastActive.bestScore >= lastActive.course.passingScore;
      recommended = {
        kind: "quiz",
        href: `/courses/${lastActive.course.slug}/quiz`,
        title: passed ? "Tinjau quiz kursus" : `Kerjakan ${lastActive.quizTitle ?? "quiz kursus"}`,
        context: lastActive.course.title,
        reason: "quiz",
      };
    }
  }

  if (!recommended) {
    const firstUnstarted = states.find(
      (state) => state.completedCount === 0 && state.attemptsCount === 0 && !state.certificate,
    );
    const firstLesson = firstUnstarted?.course.lessons[0];
    if (firstUnstarted && firstLesson) {
      recommended = {
        kind: "lesson",
        href: `/learn/${firstLesson.slug}`,
        title: firstLesson.title,
        context: firstUnstarted.course.title,
        reason: "start",
      };
    }
  }

  if (!recommended && states.length > 0) {
    const review = states[0];
    const firstLesson = review?.course.lessons[0];
    if (review && firstLesson) {
      recommended = {
        kind: "lesson",
        href: `/learn/${firstLesson.slug}`,
        title: firstLesson.title,
        context: review.course.title,
        reason: "review",
      };
    }
  }

  // Recent activity feed.
  const lessonById = new Map<string, { lesson: LessonMeta; course: CourseSummary }>();
  for (const course of courses) {
    for (const lesson of course.lessons) {
      if (lesson.id) lessonById.set(lesson.id, { lesson, course });
    }
  }

  const activity: RecentActivity[] = [];
  for (const row of progressRows.slice(0, 20)) {
    const meta = lessonById.get(row.lesson_id);
    if (!meta) continue;
    activity.push({
      type: "lesson_completed",
      at: row.completed_at,
      lessonTitle: meta.lesson.title,
      lessonSlug: meta.lesson.slug,
      courseTitle: meta.course.title,
      courseSlug: meta.course.slug,
    });
  }
  for (const attempt of attempts.slice(0, 20)) {
    const course = courses.find((entry) => entry.id === attempt.course_id);
    if (!course) continue;
    activity.push({
      type: "quiz_attempt",
      at: attempt.created_at,
      score: attempt.score,
      passed: attempt.passed,
      courseTitle: course.title,
      courseSlug: course.slug,
      quizTitle: quizzes.get(course.id ?? "")?.title ?? "Quiz kursus",
    });
  }
  for (const certificate of certificates) {
    activity.push({
      type: "certificate_issued",
      at: certificate.issued_at,
      courseTitle: certificate.course_title_snapshot,
      certificateNumber: certificate.certificate_number,
    });
  }
  activity.sort((a, b) => b.at.localeCompare(a.at));

  const quizAwaiting = inProgress.filter((state) => {
    const allLessonsDone = state.completedCount === state.totalLessons;
    const passed = state.bestScore !== null && state.bestScore >= state.course.passingScore;
    return allLessonsDone && !passed;
  });

  return {
    courses: states,
    inProgress,
    completed,
    recommended,
    recentActivity: activity.slice(0, 6),
    certificates: certificates.map((certificate) => ({
      certificateNumber: certificate.certificate_number,
      courseTitle: certificate.course_title_snapshot,
      finalScore: certificate.final_score,
      issuedAt: certificate.issued_at,
    })),
    quizAwaiting,
  };
}

export async function getLessonMetaById(
  lessonId: string,
): Promise<{ lesson: LessonMeta; courseId: string; courseSlug: string } | null> {
  const courses = await getCatalogCourses();
  for (const course of courses) {
    const lesson = course.lessons.find((entry) => entry.id === lessonId);
    if (lesson) {
      return { lesson, courseId: course.id ?? "", courseSlug: course.slug };
    }
  }
  return null;
}

/** Used by quiz pages and completion pages. */
export async function getCourseQuizMeta(courseId: string): Promise<{
  id: string;
  title: string;
  passingScore: number;
} | null> {
  const quizzes = await getQuizMetaMap();
  const quiz = quizzes.get(courseId);
  if (!quiz) return null;
  return { id: quiz.id, title: quiz.title, passingScore: quiz.passing_score };
}

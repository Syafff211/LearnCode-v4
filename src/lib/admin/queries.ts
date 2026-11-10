import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ADMIN_PAGE_SIZE } from "@/lib/validation/admin";

/**
 * Read helpers for the admin area. Every function expects the service-role
 * client obtained by `requireAdminPage` / `requireAdminAction`; none of them are
 * reachable from the browser.
 */

export type DashboardStats = {
  users: number;
  usersSuspended: number;
  admins: number;
  coursesTotal: number;
  coursesPublished: number;
  coursesDraft: number;
  coursesArchived: number;
  lessonsTotal: number;
  lessonsPublished: number;
  quizzesTotal: number;
  participants: number;
  completions: number;
  certificates: number;
  certificatesRevoked: number;
  aiMessages: number;
  aiUsers: number;
  periodDays: number;
  recentActivity: AuditRow[];
};

export type AuditRow = {
  id: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  created_at: string;
};

type RawStats = Record<string, number | string | AuditRow[]>;

export async function getDashboardStats(
  db: SupabaseClient,
  days = 30,
): Promise<DashboardStats> {
  const fallback: DashboardStats = {
    users: 0,
    usersSuspended: 0,
    admins: 0,
    coursesTotal: 0,
    coursesPublished: 0,
    coursesDraft: 0,
    coursesArchived: 0,
    lessonsTotal: 0,
    lessonsPublished: 0,
    quizzesTotal: 0,
    participants: 0,
    completions: 0,
    certificates: 0,
    certificatesRevoked: 0,
    aiMessages: 0,
    aiUsers: 0,
    periodDays: days,
    recentActivity: [],
  };

  const { data, error } = await db.rpc("admin_dashboard_stats", { p_days: days });
  if (error || !data) {
    console.error("[admin] dashboard stats failed", error?.message);
    return fallback;
  }

  const raw = data as RawStats;
  const num = (key: string) => Number(raw[key] ?? 0) || 0;
  return {
    users: num("users"),
    usersSuspended: num("users_suspended"),
    admins: num("admins"),
    coursesTotal: num("courses_total"),
    coursesPublished: num("courses_published"),
    coursesDraft: num("courses_draft"),
    coursesArchived: num("courses_archived"),
    lessonsTotal: num("lessons_total"),
    lessonsPublished: num("lessons_published"),
    quizzesTotal: num("quizzes_total"),
    participants: num("participants"),
    completions: num("completions"),
    certificates: num("certificates"),
    certificatesRevoked: num("certificates_revoked"),
    aiMessages: num("ai_messages"),
    aiUsers: num("ai_users"),
    periodDays: num("period_days") || days,
    recentActivity: Array.isArray(raw.recent_activity) ? (raw.recent_activity as AuditRow[]) : [],
  };
}

export type CourseListRow = {
  id: string;
  slug: string;
  title: string;
  level: string;
  language: string;
  status: string;
  duration_minutes: number;
  sort_order: number;
  lessons_count: number;
  required_lessons_count: number;
  participants: number;
  certificates: number;
  updated_at: string;
  total_count: number;
};

export async function listCourses(
  db: SupabaseClient,
  params: { search: string; status: string; page: number },
): Promise<{ rows: CourseListRow[]; total: number }> {
  const offset = (params.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error } = await db.rpc("admin_course_list", {
    p_search: params.search,
    p_status: params.status,
    p_limit: ADMIN_PAGE_SIZE,
    p_offset: offset,
  });
  if (error || !data) {
    console.error("[admin] course list failed", error?.message);
    return { rows: [], total: 0 };
  }
  const rows = (data as CourseListRow[]).map((row) => ({
    ...row,
    lessons_count: Number(row.lessons_count),
    required_lessons_count: Number(row.required_lessons_count),
    participants: Number(row.participants),
    certificates: Number(row.certificates),
    total_count: Number(row.total_count),
  }));
  return { rows, total: rows[0]?.total_count ?? 0 };
}

export type CourseDetailRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: string;
  language: string;
  duration_minutes: number;
  objectives: string[] | null;
  passing_score: number;
  status: string;
  position: number;
  require_all_lessons: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminLessonRow = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  summary: string;
  content_md: string;
  code_example: Record<string, unknown> | null;
  exercise: Record<string, unknown> | null;
  youtube_video_id: string | null;
  youtube_video_title: string | null;
  youtube_video_description: string | null;
  objectives: string[] | null;
  position: number;
  estimated_minutes: number;
  required: boolean;
  status: string;
  updated_at: string;
};

export type AdminQuizRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  required: boolean;
  updated_at: string;
};

export type AdminQuestionRow = {
  id: string;
  quiz_id: string;
  prompt: string;
  code: string | null;
  code_language: string | null;
  options: { id: string; text: string }[];
  correct_option_id: string;
  explanation: string;
  weight: number;
  position: number;
};

export async function getCourseDetail(
  db: SupabaseClient,
  courseId: string,
): Promise<{
  course: CourseDetailRow;
  lessons: AdminLessonRow[];
  quiz: (AdminQuizRow & { questions: AdminQuestionRow[] }) | null;
  stats: CourseListRow | null;
} | null> {
  const { data: course, error } = await db
    .from("courses")
    .select(
      "id, slug, title, tagline, description, level, language, duration_minutes, objectives, passing_score, status, position, require_all_lessons, created_at, updated_at",
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error || !course) return null;

  const [{ data: lessons }, { data: quiz }] = await Promise.all([
    db
      .from("lessons")
      .select(
        "id, course_id, slug, title, summary, content_md, code_example, exercise, youtube_video_id, youtube_video_title, youtube_video_description, objectives, position, estimated_minutes, required, status, updated_at",
      )
      .eq("course_id", courseId)
      .order("position", { ascending: true }),
    db
      .from("quizzes")
      .select("id, course_id, title, description, passing_score, required, updated_at")
      .eq("course_id", courseId)
      .maybeSingle(),
  ]);

  let fullQuiz: (AdminQuizRow & { questions: AdminQuestionRow[] }) | null = null;
  if (quiz) {
    const { data: questions } = await db
      .from("quiz_questions")
      .select(
        "id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, weight, position",
      )
      .eq("quiz_id", quiz.id)
      .order("position", { ascending: true });
    fullQuiz = {
      ...(quiz as AdminQuizRow),
      questions: (questions ?? []) as AdminQuestionRow[],
    };
  }

  const { data: statsRows } = await db.rpc("admin_course_list", {
    p_search: String(course.slug),
    p_status: "all",
    p_limit: 100,
    p_offset: 0,
  });
  const stats =
    (statsRows as CourseListRow[] | null)?.find((row) => row.id === courseId) ?? null;

  return {
    course: course as CourseDetailRow,
    lessons: (lessons ?? []) as AdminLessonRow[],
    quiz: fullQuiz,
    stats: stats
      ? {
          ...stats,
          lessons_count: Number(stats.lessons_count),
          participants: Number(stats.participants),
          certificates: Number(stats.certificates),
        }
      : null,
  };
}

export async function listLessonRows(
  db: SupabaseClient,
  params: { search: string; courseId: string; status: string; page: number },
): Promise<{ rows: (AdminLessonRow & { course_title: string })[]; total: number }> {
  let query = db
    .from("lessons")
    .select(
      "id, course_id, slug, title, summary, content_md, code_example, exercise, youtube_video_id, youtube_video_title, youtube_video_description, objectives, position, estimated_minutes, required, status, updated_at",
      { count: "exact" },
    )
    .order("course_id", { ascending: true })
    .order("position", { ascending: true });

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  if (params.courseId) query = query.eq("course_id", params.courseId);
  if (params.status !== "all") query = query.eq("status", params.status);

  const from = (params.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);

  if (error || !data) {
    console.error("[admin] lesson list failed", error?.message);
    return { rows: [], total: 0 };
  }

  const courseIds = Array.from(new Set(data.map((row) => row.course_id as string)));
  const { data: courses } = await db
    .from("courses")
    .select("id, title")
    .in("id", courseIds.length > 0 ? courseIds : ["00000000-0000-0000-0000-000000000000"]);
  const titleById = new Map((courses ?? []).map((row) => [row.id as string, row.title as string]));

  return {
    rows: (data as AdminLessonRow[]).map((row) => ({
      ...row,
      course_title: titleById.get(row.course_id) ?? "Kursus tidak dikenal",
    })),
    total: count ?? 0,
  };
}

export async function getLessonDetail(
  db: SupabaseClient,
  lessonId: string,
): Promise<{ lesson: AdminLessonRow; course: { id: string; title: string } } | null> {
  const { data, error } = await db
    .from("lessons")
    .select(
      "id, course_id, slug, title, summary, content_md, code_example, exercise, youtube_video_id, youtube_video_title, youtube_video_description, objectives, position, estimated_minutes, required, status, updated_at",
    )
    .eq("id", lessonId)
    .maybeSingle();
  if (error || !data) return null;

  const { data: course } = await db
    .from("courses")
    .select("id, title")
    .eq("id", data.course_id as string)
    .maybeSingle();

  return {
    lesson: data as AdminLessonRow,
    course: { id: (course?.id as string) ?? "", title: (course?.title as string) ?? "" },
  };
}

export async function listQuizRows(
  db: SupabaseClient,
  params: { search: string; page: number },
): Promise<{
  rows: (AdminQuizRow & { course_title: string; course_slug: string; question_count: number; attempts: number })[];
  total: number;
}> {
  let query = db
    .from("quizzes")
    .select("id, course_id, title, description, passing_score, required, updated_at", {
      count: "exact",
    })
    .order("updated_at", { ascending: false });

  if (params.search) {
    const term = params.search.replace(/[%_]/g, "");
    query = query.ilike("title", `%${term}%`);
  }

  const from = (params.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error || !data) {
    console.error("[admin] quiz list failed", error?.message);
    return { rows: [], total: 0 };
  }

  const courseIds = Array.from(new Set(data.map((row) => row.course_id as string)));
  const quizIds = data.map((row) => row.id as string);
  const [{ data: courses }, { data: questions }, { data: attempts }] = await Promise.all([
    db
      .from("courses")
      .select("id, title, slug")
      .in("id", courseIds.length > 0 ? courseIds : ["00000000-0000-0000-0000-000000000000"]),
    db
      .from("quiz_questions")
      .select("quiz_id")
      .in("quiz_id", quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"]),
    db
      .from("quiz_attempts")
      .select("quiz_id")
      .in("quiz_id", quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"]),
  ]);

  const courseById = new Map(
    (courses ?? []).map((row) => [
      row.id as string,
      { title: row.title as string, slug: row.slug as string },
    ]),
  );
  const countBy = (rows: { quiz_id: string }[] | null, key: string) => {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      const id = row[key as keyof typeof row] as string;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  };
  const questionCounts = countBy(questions as { quiz_id: string }[] | null, "quiz_id");
  const attemptCounts = countBy(attempts as { quiz_id: string }[] | null, "quiz_id");

  return {
    rows: data.map((row) => {
      const course = courseById.get(row.course_id as string);
      return {
        ...(row as AdminQuizRow),
        course_title: course?.title ?? "Kursus tidak dikenal",
        course_slug: course?.slug ?? "",
        question_count: questionCounts.get(row.id as string) ?? 0,
        attempts: attemptCounts.get(row.id as string) ?? 0,
      };
    }),
    total: count ?? 0,
  };
}

export async function getQuizDetail(
  db: SupabaseClient,
  quizId: string,
): Promise<{
  quiz: AdminQuizRow;
  course: { id: string; title: string; slug: string };
  questions: AdminQuestionRow[];
} | null> {
  const { data, error } = await db
    .from("quizzes")
    .select("id, course_id, title, description, passing_score, required, updated_at")
    .eq("id", quizId)
    .maybeSingle();
  if (error || !data) return null;

  const { data: course } = await db
    .from("courses")
    .select("id, title, slug")
    .eq("id", data.course_id as string)
    .maybeSingle();

  const { data: questions } = await db
    .from("quiz_questions")
    .select(
      "id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, weight, position",
    )
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  return {
    quiz: data as AdminQuizRow,
    course: {
      id: (course?.id as string) ?? "",
      title: (course?.title as string) ?? "",
      slug: (course?.slug as string) ?? "",
    },
    questions: (questions ?? []) as AdminQuestionRow[],
  };
}

export async function getQuestionDetail(
  db: SupabaseClient,
  questionId: string,
): Promise<(AdminQuestionRow & { quizTitle: string; quizId: string; courseId: string }) | null> {
  const { data } = await db
    .from("quiz_questions")
    .select(
      "id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, weight, position",
    )
    .eq("id", questionId)
    .maybeSingle();
  if (!data) return null;
  const { data: quiz } = await db
    .from("quizzes")
    .select("id, title, course_id")
    .eq("id", data.quiz_id as string)
    .maybeSingle();
  return {
    ...(data as AdminQuestionRow),
    quizId: data.quiz_id as string,
    quizTitle: (quiz?.title as string) ?? "",
    courseId: (quiz?.course_id as string) ?? "",
  };
}

export type UserListRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  suspended_at: string | null;
  suspended_reason: string | null;
  courses_started: number;
  lessons_completed: number;
  quiz_attempts: number;
  certificates: number;
  ai_messages: number;
  last_activity: string;
  total_count: number;
};

export async function listUserRows(
  db: SupabaseClient,
  params: { search: string; page: number },
): Promise<{ rows: UserListRow[]; total: number }> {
  const offset = (params.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error } = await db.rpc("admin_user_list", {
    p_search: params.search,
    p_limit: ADMIN_PAGE_SIZE,
    p_offset: offset,
  });
  if (error || !data) {
    console.error("[admin] user list failed", error?.message);
    return { rows: [], total: 0 };
  }
  const rows = (data as UserListRow[]).map((row) => ({
    ...row,
    courses_started: Number(row.courses_started),
    lessons_completed: Number(row.lessons_completed),
    quiz_attempts: Number(row.quiz_attempts),
    certificates: Number(row.certificates),
    ai_messages: Number(row.ai_messages),
    total_count: Number(row.total_count),
  }));
  return { rows, total: rows[0]?.total_count ?? 0 };
}

export type UserCourseRow = {
  course_id: string;
  course_title: string;
  course_slug: string;
  total_lessons: number;
  completed_lessons: number;
  best_score: number | null;
  certificate_number: string | null;
  revoked_at: string | null;
};

export type UserDetail = {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
    suspended_at: string | null;
    suspended_reason: string | null;
    preferred_language: string;
  };
  courses: UserCourseRow[];
  attempts: {
    id: string;
    score: number;
    passed: boolean;
    correct_count: number;
    question_count: number;
    created_at: string;
    course_title: string;
    course_slug: string;
  }[];
  certificates: {
    id: string;
    certificate_number: string;
    verification_code: string;
    course_title_snapshot: string;
    final_score: number;
    issued_at: string;
    revoked_at: string | null;
    revocation_reason: string | null;
  }[];
};

export async function getUserDetail(
  db: SupabaseClient,
  userId: string,
): Promise<UserDetail | null> {
  const { data, error } = await db.rpc("admin_user_detail", { p_user_id: userId });
  if (error || !data) {
    if (error) console.error("[admin] user detail failed", error.message);
    return null;
  }
  const detail = data as UserDetail;
  if (!detail.user) return null;
  return {
    user: detail.user,
    courses: (detail.courses ?? []).map((course) => ({
      ...course,
      total_lessons: Number(course.total_lessons),
      completed_lessons: Number(course.completed_lessons),
      best_score: course.best_score === null ? null : Number(course.best_score),
    })),
    attempts: detail.attempts ?? [],
    certificates: detail.certificates ?? [],
  };
}

export type CertificateListRow = {
  id: string;
  certificate_number: string;
  verification_code: string;
  recipient_name: string;
  recipient_email: string;
  course_title: string;
  final_score: number;
  issued_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  total_count: number;
};

export async function listCertificateRows(
  db: SupabaseClient,
  params: { search: string; status: string; page: number },
): Promise<{ rows: CertificateListRow[]; total: number }> {
  const offset = (params.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error } = await db.rpc("admin_certificate_list", {
    p_search: params.search,
    p_status: params.status,
    p_limit: ADMIN_PAGE_SIZE,
    p_offset: offset,
  });
  if (error || !data) {
    console.error("[admin] certificate list failed", error?.message);
    return { rows: [], total: 0 };
  }
  const rows = (data as CertificateListRow[]).map((row) => ({
    ...row,
    total_count: Number(row.total_count),
  }));
  return { rows, total: rows[0]?.total_count ?? 0 };
}

export async function listAuditRows(
  db: SupabaseClient,
  params: { search: string; action: string; page: number },
): Promise<{ rows: (AuditRow & { metadata: Record<string, unknown> })[]; total: number }> {
  let query = db
    .from("admin_audit_logs")
    .select("id, actor_email, action, target_type, target_id, reason, created_at, metadata", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (params.search) {
    const term = params.search.replace(/[%_,()]/g, "");
    query = query.or(
      `actor_email.ilike.%${term}%,action.ilike.%${term}%,target_id.ilike.%${term}%,reason.ilike.%${term}%`,
    );
  }
  if (params.action && params.action !== "all") query = query.eq("action", params.action);

  const from = (params.page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error || !data) {
    console.error("[admin] audit list failed", error?.message);
    return { rows: [], total: 0 };
  }
  return {
    rows: data as (AuditRow & { metadata: Record<string, unknown> })[],
    total: count ?? 0,
  };
}

export async function listCourseOptions(
  db: SupabaseClient,
): Promise<{ id: string; title: string; slug: string; passing_score: number; status: string }[]> {
  const { data } = await db
    .from("courses")
    .select("id, title, slug, passing_score, status")
    .order("position", { ascending: true });
  return (data ?? []) as { id: string; title: string; slug: string; passing_score: number; status: string }[];
}

export async function getPlatformSettingsRow(db: SupabaseClient) {
  const { data } = await db
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return data as
    | {
        platform_name: string;
        short_description: string;
        logo_url: string | null;
        favicon_url: string | null;
        default_language: string;
        certificate_signature: string;
        default_passing_score: number;
        contact_email: string | null;
        contact_url: string | null;
        maintenance_mode: boolean;
        maintenance_message: string;
        updated_at: string;
      }
    | null;
}

export async function getAiSettingsRow(db: SupabaseClient) {
  const { data } = await db.from("ai_settings").select("*").eq("id", 1).maybeSingle();
  return data as
    | {
        enabled: boolean;
        daily_message_limit: number;
        max_input_chars: number;
        max_output_tokens: number;
        model: string;
        features: string[];
        learning_instructions: string;
        updated_at: string;
      }
    | null;
}

export async function getQuizAttemptSummary(
  db: SupabaseClient,
  quizId: string,
  page: number,
) {
  const offset = (page - 1) * ADMIN_PAGE_SIZE;
  const { data, error } = await db.rpc("admin_quiz_attempts", {
    p_quiz_id: quizId,
    p_limit: ADMIN_PAGE_SIZE,
    p_offset: offset,
  });
  if (error || !data) {
    console.error("[admin] quiz attempts failed", error?.message);
    return null;
  }
  return data as {
    quiz: {
      id: string;
      title: string;
      passing_score: number;
      required: boolean;
      course_id: string;
      course_title: string;
      course_slug: string;
    } | null;
    summary: { attempts: number; participants: number; passed: number; average_score: number };
    attempts: {
      id: string;
      score: number;
      passed: boolean;
      correct_count: number;
      question_count: number;
      created_at: string;
      full_name: string;
      email: string;
    }[];
  };
}

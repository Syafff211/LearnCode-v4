import "server-only";

import { courses as contentCourses, getCourseBySlug } from "@/content/index";
import type { CourseSummary, LessonMeta } from "@/lib/data/types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: CourseSummary["level"];
  duration_minutes: number;
  objectives: string[] | null;
  passing_score: number;
  position: number;
  require_all_lessons: boolean;
};

type LessonRow = {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  summary: string;
  estimated_minutes: number;
  position: number;
  required: boolean;
};

function contentToSummary(slug: string): CourseSummary | null {
  const course = getCourseBySlug(slug);
  if (!course) return null;
  return {
    id: null,
    slug: course.slug,
    title: course.title,
    tagline: course.tagline,
    description: course.description,
    level: course.level,
    durationMinutes: course.durationMinutes,
    objectives: course.objectives,
    passingScore: course.passingScore,
    position: course.position,
    requireAllLessons: true,
    status: "published",
    lessons: course.lessons.map((lesson, index) => ({
      id: null,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      estimatedMinutes: lesson.estimatedMinutes,
      position: index + 1,
      required: true,
      status: "published",
    })),
    source: "content",
  };
}

function buildSummaries(
  courseRows: CourseRow[],
  lessonRows: LessonRow[],
): CourseSummary[] {
  const lessonsByCourse = new Map<string, LessonMeta[]>();
  for (const lesson of lessonRows) {
    const list = lessonsByCourse.get(lesson.course_id) ?? [];
    list.push({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      estimatedMinutes: lesson.estimated_minutes,
      position: lesson.position,
      required: lesson.required,
      status: "published",
    });
    lessonsByCourse.set(lesson.course_id, list);
  }

  return courseRows
    .map((course) => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      tagline: course.tagline,
      description: course.description,
      level: course.level,
      durationMinutes: course.duration_minutes,
      objectives: course.objectives ?? [],
      passingScore: course.passing_score,
      position: course.position,
      lessons: (lessonsByCourse.get(course.id) ?? []).sort((a, b) => a.position - b.position),
      source: "database" as const,
    }))
    .sort((a, b) => a.position - b.position);
}

async function fetchCoursesFromDatabase(): Promise<CourseSummary[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: courseRows, error: courseError } = await supabase
      .from("courses")
      .select(
        "id, slug, title, tagline, description, level, duration_minutes, objectives, passing_score, position, require_all_lessons",
      )
      .eq("status", "published")
      .order("position", { ascending: true });

    if (courseError || !courseRows || courseRows.length === 0) return null;

    const { data: lessonRows, error: lessonError } = await supabase
      .from("lessons")
      .select("id, course_id, slug, title, summary, estimated_minutes, position, required")
      .eq("status", "published")
      .order("position", { ascending: true });

    if (lessonError || !lessonRows) return null;

    return buildSummaries(courseRows as CourseRow[], lessonRows as LessonRow[]);
  } catch (error) {
    console.error(
      "[catalog] falling back to bundled content",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export type TutorLessonSummaryOption = {
  id: string;
  title: string;
  courseTitle: string;
};

export async function getTutorLessonOptions(): Promise<TutorLessonSummaryOption[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createSupabaseServerClient();
    const [coursesRes, lessonsRes] = await Promise.all([
      supabase
        .from("courses")
        .select("id, title, position")
        .eq("status", "published")
        .order("position", { ascending: true }),
      supabase
        .from("lessons")
        .select("id, course_id, title, position")
        .eq("status", "published")
        .order("position", { ascending: true }),
    ]);

    if (coursesRes.error || lessonsRes.error || !coursesRes.data || !lessonsRes.data) {
      return [];
    }

    const courseById = new Map<string, { title: string; position: number }>();
    for (const course of coursesRes.data) {
      courseById.set(course.id as string, {
        title: course.title as string,
        position: Number(course.position ?? 0),
      });
    }

    return lessonsRes.data
      .map((lesson) => {
        const course = courseById.get(lesson.course_id as string);
        if (!course) return null;
        return {
          id: lesson.id as string,
          title: lesson.title as string,
          courseTitle: course.title,
          coursePos: course.position,
          lessonPos: Number(lesson.position ?? 0),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.coursePos - b.coursePos || a.lessonPos - b.lessonPos)
      .map(({ id, title, courseTitle }) => ({ id, title, courseTitle }));
  } catch (error) {
    console.error(
      "[catalog] tutor lesson options fallback",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

export async function getCatalogCourses(): Promise<CourseSummary[]> {
  const databaseCourses = await fetchCoursesFromDatabase();
  if (databaseCourses) return databaseCourses;
  return contentCourses.map((course) => {
    const summary = contentToSummary(course.slug);
    if (!summary) throw new Error("Konten kursus tidak lengkap");
    return summary;
  });
}

export async function getCourseSummary(slug: string): Promise<CourseSummary | null> {
  const databaseCourses = await fetchCoursesFromDatabase();
  if (databaseCourses) {
    return databaseCourses.find((course) => course.slug === slug) ?? null;
  }
  return contentToSummary(slug);
}

import { cssCourse } from "@/content/css-course";
import { htmlCourse } from "@/content/html-course";
import { javascriptCourse } from "@/content/javascript-course";
import type { Course, Lesson } from "@/content/types";

/**
 * Single source of truth for course content. The same module feeds the public
 * course catalogue (so it is browsable before the database is connected) and
 * the generated SQL seed that is imported into Supabase.
 */
export const courses: Course[] = [htmlCourse, cssCourse, javascriptCourse].sort(
  (a, b) => a.position - b.position,
);

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function getAllLessonSlugs(): string[] {
  return courses.flatMap((course) => course.lessons.map((lesson) => lesson.slug));
}

export function findLessonInContent(
  slug: string,
): { course: Course; lesson: Lesson; index: number } | undefined {
  for (const course of courses) {
    const index = course.lessons.findIndex((lesson) => lesson.slug === slug);
    if (index !== -1) {
      const lesson = course.lessons[index];
      if (!lesson) return undefined;
      return { course, lesson, index };
    }
  }
  return undefined;
}

export * from "@/content/types";

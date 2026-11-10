import { describe, expect, it } from "vitest";

import { courses, getCourseBySlug, findLessonInContent } from "@/content";

const allLessons = courses.flatMap((course) =>
  course.lessons.map((lesson) => ({ course, lesson })),
);

describe("course catalogue", () => {
  it("ships the three required courses", () => {
    expect(courses.map((course) => course.slug)).toEqual([
      "html-fundamentals",
      "css-fundamentals",
      "javascript-fundamentals",
    ]);
  });

  it("has at least three substantive lessons per course", () => {
    for (const course of courses) {
      expect(course.lessons.length, course.slug).toBeGreaterThanOrEqual(3);
      expect(course.lessons.length, course.slug).toBeLessThanOrEqual(8);
    }
    expect(allLessons.length).toBeGreaterThanOrEqual(9);
  });

  it("uses a unique slug for every course and lesson", () => {
    const slugs = [...courses.map((course) => course.slug), ...allLessons.map(({ lesson }) => lesson.slug)];
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has realistic metadata for every course", () => {
    for (const course of courses) {
      expect(course.title.length).toBeGreaterThan(3);
      expect(course.tagline.length).toBeGreaterThan(10);
      expect(course.description.length).toBeGreaterThan(60);
      expect(course.objectives.length).toBeGreaterThanOrEqual(3);
      expect(course.objectives.every((objective) => objective.length > 15)).toBe(true);
      expect(course.passingScore).toBe(80);
      expect(course.durationMinutes).toBeGreaterThan(0);
    }
  });

  it("does not contain placeholder copy", () => {
    const corpus = JSON.stringify(courses).toLowerCase();
    for (const banned of ["lorem ipsum", "coming soon", "placeholder text"]) {
      expect(corpus.includes(banned), banned).toBe(false);
    }
  });
});

describe("lesson content", () => {
  it("is long enough to teach something", () => {
    for (const { lesson } of allLessons) {
      expect(lesson.content.length, lesson.slug).toBeGreaterThan(900);
      expect(lesson.content.includes("## "), lesson.slug).toBe(true);
      expect(lesson.summary.length, lesson.slug).toBeGreaterThan(30);
      expect(lesson.estimatedMinutes, lesson.slug).toBeGreaterThan(2);
    }
  });

  it("has a usable code example in every lesson", () => {
    for (const { lesson } of allLessons) {
      expect(["html", "css", "javascript"]).toContain(lesson.code.language);
      expect(lesson.code.code.length, lesson.slug).toBeGreaterThan(20);
      expect(lesson.code.filename.length, lesson.slug).toBeGreaterThan(0);
    }
  });

  it("has an exercise with steps, hint, and starter files", () => {
    for (const { lesson } of allLessons) {
      expect(lesson.exercise.title.length, lesson.slug).toBeGreaterThan(3);
      expect(lesson.exercise.brief.length, lesson.slug).toBeGreaterThan(20);
      expect(lesson.exercise.steps.length, lesson.slug).toBeGreaterThanOrEqual(2);
      expect(lesson.exercise.hint.length, lesson.slug).toBeGreaterThan(10);
      const starter = lesson.exercise.starter;
      const nonEmpty = [starter.html, starter.css, starter.js].filter(
        (value) => value.trim().length > 0,
      );
      expect(nonEmpty.length, lesson.slug).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("quizzes", () => {
  it("has at least five questions per course", () => {
    for (const course of courses) {
      expect(course.quiz.questions.length, course.slug).toBeGreaterThanOrEqual(5);
      expect(course.quiz.title.length).toBeGreaterThan(3);
      expect(course.quiz.description.length).toBeGreaterThan(20);
    }
  });

  it("only accepts answers that exist in the options", () => {
    for (const course of courses) {
      const questionIds = new Set<string>();
      for (const question of course.quiz.questions) {
        expect(questionIds.has(question.id), question.id).toBe(false);
        questionIds.add(question.id);

        expect(question.options.length, question.id).toBeGreaterThanOrEqual(3);
        expect(question.options.length, question.id).toBeLessThanOrEqual(4);
        expect(question.options.some((option) => option.id === question.correctOptionId)).toBe(true);
        expect(new Set(question.options.map((option) => option.id)).size).toBe(
          question.options.length,
        );
        expect(question.explanation.length, question.id).toBeGreaterThan(20);
      }
    }
  });

  it("has a passing score of 80 by default", () => {
    expect(courses.every((course) => course.passingScore === 80)).toBe(true);
  });
});

describe("content lookups", () => {
  it("finds a course by slug", () => {
    expect(getCourseBySlug("css-fundamentals")?.title).toContain("CSS");
    expect(getCourseBySlug("unknown")).toBeUndefined();
  });

  it("finds a lesson with its course and index", () => {
    const found = findLessonInContent("js-dom-event");
    expect(found?.course.slug).toBe("javascript-fundamentals");
    expect(found?.index).toBeGreaterThanOrEqual(0);
    expect(findLessonInContent("does-not-exist")).toBeUndefined();
  });

  it("keeps the playground deep links pointing at real lessons", () => {
    for (const slug of ["html-formulir-aksesibilitas", "css-flexbox-grid", "js-dom-event"]) {
      expect(findLessonInContent(slug), slug).toBeDefined();
    }
  });
});

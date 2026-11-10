/**
 * Generates supabase/seed.sql from the typed course content.
 *
 * Run with: npm run seed:generate
 *
 * IDs are deterministic (derived from slugs) so re-running the seed updates
 * the same rows instead of creating duplicates.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { courses } from "../src/content/index";

function stableUuid(key: string): string {
  const hash = createHash("sha1").update(`learncode:${key}`).digest("hex");
  const variant = ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16);
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `${variant}${hash.slice(18, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

const dollar = "$lcseed$";

function text(value: string): string {
  if (value.includes(dollar)) {
    throw new Error("Seed content contains the dollar-quote delimiter.");
  }
  return `${dollar}${value}${dollar}`;
}

function json(value: unknown): string {
  return `${text(JSON.stringify(value))}::jsonb`;
}

function textArray(values: string[]): string {
  if (values.length === 0) return "array[]::text[]";
  return `array[${values.map(text).join(", ")}]::text[]`;
}

const lines: string[] = [];
lines.push("-- ============================================================================");
lines.push("-- LearnCode seed data — GENERATED FILE, do not edit by hand.");
lines.push("-- Source: src/content/*.ts   Regenerate: npm run seed:generate");
lines.push("-- Idempotent by deterministic IDs. Apply after the schema migration.");
lines.push("-- ============================================================================");
lines.push("");
lines.push("-- Guard: fail with a readable message instead of a bare 42P01 when the");
lines.push("-- schema migrations have not been applied to this database yet.");
lines.push(`do $lcguard$
begin
  if to_regclass('public.courses') is null
     or to_regclass('public.lessons') is null
     or to_regclass('public.quizzes') is null then
    raise exception using
      message = 'Skema LearnCode belum ada di database ini. Jalankan migration 20260101000000_learncode_schema.sql (dan migration admin sesudahnya) sebelum seed.sql.',
      hint = 'Supabase: SQL editor -> jalankan file migration sesuai urutan nama, lalu jalankan ulang seed ini.';
  end if;
end
$lcguard$;`);
lines.push("");

for (const course of courses) {
  const courseId = stableUuid(`course:${course.slug}`);
  lines.push(`-- Course: ${course.title}`);
  lines.push(
    `insert into public.courses (id, slug, title, tagline, description, level, duration_minutes, objectives, passing_score, status, position)
values (
  '${courseId}',
  ${text(course.slug)},
  ${text(course.title)},
  ${text(course.tagline)},
  ${text(course.description)},
  ${text(course.level)},
  ${course.durationMinutes},
  ${textArray(course.objectives)},
  ${course.passingScore},
  'published',
  ${course.position}
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  tagline = excluded.tagline,
  description = excluded.description,
  level = excluded.level,
  duration_minutes = excluded.duration_minutes,
  objectives = excluded.objectives,
  passing_score = excluded.passing_score,
  status = excluded.status,
  position = excluded.position;`,
  );
  lines.push("");

  course.lessons.forEach((lesson, index) => {
    const lessonId = stableUuid(`lesson:${lesson.slug}`);
    lines.push(
      `insert into public.lessons (id, course_id, slug, title, summary, content_md, code_example, exercise, position, estimated_minutes)
values (
  '${lessonId}',
  '${courseId}',
  ${text(lesson.slug)},
  ${text(lesson.title)},
  ${text(lesson.summary)},
  ${text(lesson.content)},
  ${json(lesson.code)},
  ${json(lesson.exercise)},
  ${index + 1},
  ${lesson.estimatedMinutes}
)
on conflict (id) do update set
  course_id = excluded.course_id,
  slug = excluded.slug,
  title = excluded.title,
  summary = excluded.summary,
  content_md = excluded.content_md,
  code_example = excluded.code_example,
  exercise = excluded.exercise,
  position = excluded.position,
  estimated_minutes = excluded.estimated_minutes;`,
    );
    lines.push("");
  });

  const quizId = stableUuid(`quiz:${course.slug}`);
  lines.push(
    `insert into public.quizzes (id, course_id, title, description, passing_score)
values (
  '${quizId}',
  '${courseId}',
  ${text(course.quiz.title)},
  ${text(course.quiz.description)},
  ${course.passingScore}
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  passing_score = excluded.passing_score;`,
  );
  lines.push("");

  course.quiz.questions.forEach((question, index) => {
    const questionId = stableUuid(`question:${course.slug}:${question.id}`);
    lines.push(
      `insert into public.quiz_questions (id, quiz_id, prompt, code, code_language, options, correct_option_id, explanation, position)
values (
  '${questionId}',
  '${quizId}',
  ${text(question.prompt)},
  ${question.code ? text(question.code) : "null"},
  ${question.codeLanguage ? text(question.codeLanguage) : "null"},
  ${json(question.options)},
  ${text(question.correctOptionId)},
  ${text(question.explanation)},
  ${index + 1}
)
on conflict (id) do update set
  quiz_id = excluded.quiz_id,
  prompt = excluded.prompt,
  code = excluded.code,
  code_language = excluded.code_language,
  options = excluded.options,
  correct_option_id = excluded.correct_option_id,
  explanation = excluded.explanation,
  position = excluded.position;`,
    );
    lines.push("");
  });
}

lines.push("-- Fill starter blog-to-course links when the blog migrations ran before this course seed.");
lines.push(`do $lcbloglinks$
begin
  if to_regclass('public.blog_posts') is not null then
    execute $bloglinkupdate$
      update public.blog_posts as post
      set related_course_id = course.id
      from public.courses as course
      where post.related_course_id is null
        and course.status = 'published'
        and course.slug = case post.slug
          when 'html-struktur-semantik' then 'html-fundamentals'
          when 'html-form-aksesibel' then 'html-fundamentals'
          when 'css-cascade-specificity' then 'css-fundamentals'
          when 'css-box-model-responsive' then 'css-fundamentals'
          when 'css-flexbox-vs-grid' then 'css-fundamentals'
          when 'javascript-variabel-tipe' then 'javascript-fundamentals'
          when 'javascript-fungsi-scope' then 'javascript-fundamentals'
          when 'javascript-dom-events' then 'javascript-fundamentals'
          when 'debugging-javascript' then 'javascript-fundamentals'
          when 'belajar-coding-proyek-daftar-tugas' then 'javascript-fundamentals'
          else null
        end;
    $bloglinkupdate$;
  end if;
end
$lcbloglinks$;`);
lines.push("");
lines.push("-- Ensure PostgREST sees the new rows immediately.");
lines.push("notify pgrst, 'reload schema';");
lines.push("");

const target = resolve(process.cwd(), "supabase/seed.sql");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${lines.join("\n")}\n`, "utf8");

const lessonCount = courses.reduce((total, course) => total + course.lessons.length, 0);
const questionCount = courses.reduce(
  (total, course) => total + course.quiz.questions.length,
  0,
);
console.log(`Wrote ${target}`);
console.log(
  `${courses.length} courses, ${lessonCount} lessons, ${questionCount} quiz questions.`,
);

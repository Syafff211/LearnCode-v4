import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SanitizedQuizQuestion = {
  id: string;
  prompt: string;
  code: string | null;
  codeLanguage: "html" | "css" | "javascript" | null;
  options: { id: string; text: string }[];
  position: number;
};

export type SanitizedQuiz = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  passingScore: number;
  required: boolean;
  questions: SanitizedQuizQuestion[];
};

export type QuizQuestionWithAnswer = SanitizedQuizQuestion & {
  correctOptionId: string;
  explanation: string;
  weight: number;
};

export type QuizWithAnswers = Omit<SanitizedQuiz, "questions"> & {
  questions: QuizQuestionWithAnswer[];
};

type Option = { id: string; text: string };

function parseOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const record = entry as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.text !== "string") return null;
      return { id: record.id, text: record.text };
    })
    .filter((entry): entry is Option => entry !== null);
}

function toQuestion(row: Record<string, unknown>): QuizQuestionWithAnswer {
  return {
    id: String(row.id),
    prompt: String(row.prompt),
    code: typeof row.code === "string" ? row.code : null,
    codeLanguage:
      row.code_language === "html" ||
      row.code_language === "css" ||
      row.code_language === "javascript"
        ? row.code_language
        : null,
    options: parseOptions(row.options),
    position: Number(row.position),
    correctOptionId: String(row.correct_option_id),
    explanation: String(row.explanation),
    weight: Number(row.weight) > 0 ? Number(row.weight) : 1,
  };
}

/** Server-only: includes answer keys. Never send this object to the browser. */
export async function getQuizWithAnswersByCourseId(
  courseId: string,
): Promise<QuizWithAnswers | null> {
  const admin = createSupabaseAdminClient();

  const { data: quiz, error } = await admin
    .from("quizzes")
    .select("id, course_id, title, description, passing_score, required")
    .eq("course_id", courseId)
    .maybeSingle();

  if (error || !quiz) return null;

  const { data: questions, error: questionsError } = await admin
    .from("quiz_questions")
    .select("id, prompt, code, code_language, options, correct_option_id, explanation, position, weight")
    .eq("quiz_id", quiz.id)
    .order("position", { ascending: true });

  if (questionsError || !questions) return null;

  return {
    id: quiz.id as string,
    courseId: quiz.course_id as string,
    title: quiz.title as string,
    description: (quiz.description as string) ?? "",
    passingScore: Number(quiz.passing_score),
    required: quiz.required !== false,
    questions: questions.map((row) => toQuestion(row as Record<string, unknown>)),
  };
}

export async function getQuizWithAnswersById(quizId: string): Promise<QuizWithAnswers | null> {
  const admin = createSupabaseAdminClient();

  const { data: quiz, error } = await admin
    .from("quizzes")
    .select("id, course_id, title, description, passing_score, required")
    .eq("id", quizId)
    .maybeSingle();

  if (error || !quiz) return null;

  const { data: questions, error: questionsError } = await admin
    .from("quiz_questions")
    .select("id, prompt, code, code_language, options, correct_option_id, explanation, position, weight")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  if (questionsError || !questions) return null;

  return {
    id: quiz.id as string,
    courseId: quiz.course_id as string,
    title: quiz.title as string,
    description: (quiz.description as string) ?? "",
    passingScore: Number(quiz.passing_score),
    required: quiz.required !== false,
    questions: questions.map((row) => toQuestion(row as Record<string, unknown>)),
  };
}

/** Strip answer keys before sending a quiz to the browser. */
export function sanitizeQuiz(quiz: QuizWithAnswers): SanitizedQuiz {
  return {
    id: quiz.id,
    courseId: quiz.courseId,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passingScore,
    required: quiz.required,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      code: question.code,
      codeLanguage: question.codeLanguage,
      options: question.options,
      position: question.position,
    })),
  };
}

export async function getSanitizedQuizForCourse(courseId: string): Promise<SanitizedQuiz | null> {
  const quiz = await getQuizWithAnswersByCourseId(courseId);
  return quiz ? sanitizeQuiz(quiz) : null;
}

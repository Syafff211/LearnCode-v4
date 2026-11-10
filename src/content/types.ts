export type CodeLanguage = "html" | "css" | "javascript";

export type CourseLevel = "pemula" | "menengah" | "lanjutan";

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  code?: string;
  codeLanguage?: CodeLanguage;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
};

export type LessonExercise = {
  title: string;
  brief: string;
  steps: string[];
  hint: string;
  starter: {
    html: string;
    css: string;
    js: string;
  };
};

export type Lesson = {
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  /** Lesson theory, markdown. Rendered with Shiki highlighting on the server. */
  content: string;
  code: {
    language: CodeLanguage;
    filename: string;
    caption?: string;
    code: string;
  };
  exercise: LessonExercise;
};

export type CourseQuiz = {
  title: string;
  description: string;
  questions: QuizQuestion[];
};

export type Course = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: CourseLevel;
  durationMinutes: number;
  passingScore: number;
  position: number;
  objectives: string[];
  lessons: Lesson[];
  quiz: CourseQuiz;
};

export const courseLevelLabel: Record<CourseLevel, string> = {
  pemula: "Pemula",
  menengah: "Menengah",
  lanjutan: "Lanjutan",
};

export const languageLabel: Record<CodeLanguage, string> = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
};

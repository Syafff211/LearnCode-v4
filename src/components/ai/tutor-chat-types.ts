import type { AiAction } from "@/lib/validation/ai";

export type TutorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  streaming?: boolean;
  stopped?: boolean;
  failed?: boolean;
};

export type TutorConversation = {
  id: string;
  title: string;
  updated_at: string;
  lesson_id: string | null;
};

export type TutorLessonOption = {
  id: string;
  title: string;
  courseTitle: string;
};

export type TutorError = {
  message: string;
  code: string;
  retryable: boolean;
};

export type TutorPayload = {
  action: AiAction;
  message: string;
  code: string;
  codeLanguage: "html" | "css" | "javascript";
  lessonId: string | null;
  language: "id" | "en";
};

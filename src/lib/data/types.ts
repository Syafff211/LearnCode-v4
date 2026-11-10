export type CourseLevel = "pemula" | "menengah" | "lanjutan";

export type LessonMeta = {
  id: string | null;
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  position: number;
  required?: boolean;
  status?: string;
};

export type CourseSummary = {
  id: string | null;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: CourseLevel;
  durationMinutes: number;
  objectives: string[];
  passingScore: number;
  position: number;
  requireAllLessons?: boolean;
  status?: string;
  lessons: LessonMeta[];
  source: "database" | "content";
};

export type CourseProgressState = {
  course: CourseSummary;
  completedLessonIds: string[];
  completedCount: number;
  totalLessons: number;
  percent: number;
  attemptsCount: number;
  bestScore: number | null;
  quizId: string | null;
  quizTitle: string | null;
  quizPassingScore: number | null;
  certificate: {
    certificateNumber: string;
    issuedAt: string;
    finalScore: number;
  } | null;
  lastActivityAt: string | null;
  lastCompletedLessonSlug: string | null;
};

export type RecentActivity =
  | {
      type: "lesson_completed";
      at: string;
      lessonTitle: string;
      lessonSlug: string;
      courseTitle: string;
      courseSlug: string;
    }
  | {
      type: "quiz_attempt";
      at: string;
      score: number;
      passed: boolean;
      courseTitle: string;
      courseSlug: string;
      quizTitle: string;
    }
  | {
      type: "certificate_issued";
      at: string;
      courseTitle: string;
      certificateNumber: string;
    };

export type NextStepSuggestion = {
  kind: "lesson" | "quiz";
  href: string;
  title: string;
  context: string;
  reason: "continue" | "quiz" | "start" | "review";
};

export type DashboardData = {
  courses: CourseProgressState[];
  inProgress: CourseProgressState[];
  completed: CourseProgressState[];
  recommended: NextStepSuggestion | null;
  recentActivity: RecentActivity[];
  certificates: {
    certificateNumber: string;
    courseTitle: string;
    finalScore: number;
    issuedAt: string;
  }[];
  quizAwaiting: CourseProgressState[];
};

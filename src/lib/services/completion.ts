/**
 * Pure completion rules. No I/O — every value comes from the database and is
 * passed in by trusted server code. Used for both the UI progress panel and
 * the certificate gate.
 */

export type QuizAttemptSummary = {
  score: number;
  passed: boolean;
};

export type RequirementKey = "lessons" | "quiz" | "score";

export type CompletionRequirement = {
  key: RequirementKey;
  label: string;
  met: boolean;
  detail: string;
};

export type CompletionEvaluation = {
  eligible: boolean;
  finalScore: number | null;
  bestScore: number | null;
  completedLessons: number;
  totalLessons: number;
  attemptsCount: number;
  requirements: CompletionRequirement[];
};

export function evaluateCourseCompletion(input: {
  totalLessons: number;
  completedLessonIds: string[];
  quizExists: boolean;
  attempts: QuizAttemptSummary[];
  passingScore: number;
  /** Courses can waive the lesson requirement (quiz-only completion). */
  lessonsRequired?: boolean;
  /** A quiz may exist but be optional for the certificate. */
  quizRequired?: boolean;
}): CompletionEvaluation {
  const uniqueCompleted = new Set(input.completedLessonIds.filter(Boolean));
  const completedLessons = uniqueCompleted.size;
  const totalLessons = Math.max(0, input.totalLessons);
  const attempts = input.attempts.filter(
    (attempt) => Number.isFinite(attempt.score) && attempt.score >= 0 && attempt.score <= 100,
  );
  const bestScore =
    attempts.length === 0 ? null : Math.max(...attempts.map((attempt) => attempt.score));
  const passingScore = Math.min(100, Math.max(0, input.passingScore));

  const lessonsRequired = input.lessonsRequired ?? true;
  const quizRequired = input.quizRequired ?? true;
  const lessonsMet = !lessonsRequired || (totalLessons > 0 && completedLessons >= totalLessons);
  const quizMet = !quizRequired || (input.quizExists && attempts.length > 0);
  const scoreMet = bestScore !== null && bestScore >= passingScore;

  const requirements: CompletionRequirement[] = [
    {
      key: "lessons",
      label: lessonsRequired ? "Selesaikan semua lesson wajib" : "Lesson tidak diwajibkan",
      met: lessonsMet,
      detail: lessonsRequired
        ? `${completedLessons} dari ${totalLessons} lesson selesai`
        : "Kursus ini tidak mensyaratkan lesson untuk sertifikat",
    },
    {
      key: "quiz",
      label: quizRequired ? "Kerjakan quiz kursus" : "Quiz tidak diwajibkan",
      met: quizMet,
      detail: !quizRequired
        ? "Quiz tersedia, tetapi bukan syarat sertifikat"
        : quizMet
          ? `${attempts.length} percobaan tersimpan`
          : "Quiz belum dikerjakan",
    },
    {
      key: "score",
      label: `Raih nilai minimal ${passingScore}%`,
      met: scoreMet,
      detail:
        bestScore === null
          ? "Belum ada nilai"
          : `Nilai terbaik kamu ${Math.round(bestScore)}%`,
    },
  ];

  return {
    eligible: lessonsMet && quizMet && scoreMet,
    finalScore: bestScore,
    bestScore,
    completedLessons,
    totalLessons,
    attemptsCount: attempts.length,
    requirements,
  };
}

export type GradableQuestion = {
  id: string;
  correctOptionId: string;
  optionIds: string[];
  explanation: string;
  /** Relative weight; defaults to 1 so legacy quizzes keep their math. */
  weight?: number;
};

export type GradedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  correct: boolean;
  explanation: string;
};

export type GradingResult = {
  score: number;
  correctCount: number;
  questionCount: number;
  passed: boolean;
  answers: GradedAnswer[];
};

/**
 * Server-side grading. Unknown question ids in `answers` are ignored, missing
 * answers are counted as incorrect, and option ids that do not belong to the
 * question are never treated as correct.
 */
export function gradeQuiz(
  questions: GradableQuestion[],
  answers: Record<string, string>,
  passingScore: number,
): GradingResult {
  const graded: GradedAnswer[] = questions.map((question) => {
    const raw = answers[question.id];
    const selected = typeof raw === "string" && raw.length > 0 ? raw : null;
    const valid = selected !== null && question.optionIds.includes(selected);
    return {
      questionId: question.id,
      selectedOptionId: selected,
      correctOptionId: question.correctOptionId,
      correct: valid && selected === question.correctOptionId,
      explanation: question.explanation,
    };
  });

  const correctCount = graded.filter((answer) => answer.correct).length;
  const questionCount = questions.length;
  const weightOf = (index: number) => {
    const weight = questions[index]?.weight ?? 1;
    return Number.isFinite(weight) && weight > 0 ? weight : 1;
  };
  const totalWeight = questions.reduce((sum, _question, index) => sum + weightOf(index), 0);
  const earnedWeight = graded.reduce(
    (sum, answer, index) => sum + (answer.correct ? weightOf(index) : 0),
    0,
  );
  const score =
    questionCount === 0 || totalWeight === 0
      ? 0
      : Math.round((earnedWeight / totalWeight) * 100);

  return {
    score,
    correctCount,
    questionCount,
    passed: score >= Math.min(100, Math.max(0, passingScore)),
    answers: graded,
  };
}

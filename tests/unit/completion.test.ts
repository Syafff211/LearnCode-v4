import { describe, expect, it } from "vitest";

import { evaluateCourseCompletion, gradeQuiz } from "@/lib/services/completion";

describe("gradeQuiz", () => {
  const questions = [
    {
      id: "q1",
      correctOptionId: "a",
      optionIds: ["a", "b", "c"],
      explanation: "Penjelasan satu.",
    },
    {
      id: "q2",
      correctOptionId: "d",
      optionIds: ["c", "d"],
      explanation: "Penjelasan dua.",
    },
    {
      id: "q3",
      correctOptionId: "e",
      optionIds: ["e", "f"],
      explanation: "Penjelasan tiga.",
    },
  ];

  it("scores a perfect attempt as 100 and passed", () => {
    const result = gradeQuiz(questions, { q1: "a", q2: "d", q3: "e" }, 80);
    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(3);
    expect(result.questionCount).toBe(3);
    expect(result.passed).toBe(true);
    expect(result.answers.every((answer) => answer.correct)).toBe(true);
  });

  it("rounds partial scores and fails below the passing score", () => {
    const result = gradeQuiz(questions, { q1: "a", q2: "d", q3: "f" }, 80);
    expect(result.score).toBe(67);
    expect(result.passed).toBe(false);
    expect(result.correctCount).toBe(2);
  });

  it("treats missing answers as incorrect instead of throwing", () => {
    const result = gradeQuiz(questions, { q1: "a" }, 80);
    expect(result.score).toBe(33);
    expect(result.answers[1]?.selectedOptionId).toBeNull();
    expect(result.answers[1]?.correct).toBe(false);
  });

  it("never accepts an option id that does not belong to the question", () => {
    const result = gradeQuiz(questions, { q1: "d", q2: "d", q3: "e" }, 80);
    expect(result.answers[0]?.correct).toBe(false);
    expect(result.score).toBe(67);
  });

  it("ignores unknown question ids instead of counting them", () => {
    const result = gradeQuiz(questions, { q1: "a", q2: "d", q3: "e", zzz: "a" }, 80);
    expect(result.score).toBe(100);
    expect(result.answers).toHaveLength(3);
  });

  it("passes exactly at the passing score", () => {
    const result = gradeQuiz(
      [
        { id: "q1", correctOptionId: "a", optionIds: ["a"], explanation: "" },
        { id: "q2", correctOptionId: "b", optionIds: ["b"], explanation: "" },
        { id: "q3", correctOptionId: "c", optionIds: ["c"], explanation: "" },
        { id: "q4", correctOptionId: "d", optionIds: ["d"], explanation: "" },
        { id: "q5", correctOptionId: "e", optionIds: ["e"], explanation: "" },
      ],
      { q1: "a", q2: "b", q3: "c", q4: "d", q5: "x" },
      80,
    );
    expect(result.score).toBe(80);
    expect(result.passed).toBe(true);
  });

  it("returns zero for an empty quiz rather than dividing by zero", () => {
    const result = gradeQuiz([], {}, 80);
    expect(result.score).toBe(0);
    expect(result.questionCount).toBe(0);
    expect(result.passed).toBe(false);
  });
});

describe("evaluateCourseCompletion", () => {
  const base = {
    totalLessons: 4,
    completedLessonIds: ["l1", "l2", "l3", "l4"],
    quizExists: true,
    attempts: [{ score: 90, passed: true }],
    passingScore: 80,
  };

  it("is eligible only when lessons, quiz attempt, and score are all met", () => {
    const result = evaluateCourseCompletion(base);
    expect(result.eligible).toBe(true);
    expect(result.finalScore).toBe(90);
    expect(result.requirements.every((requirement) => requirement.met)).toBe(true);
  });

  it("is not eligible while lessons are missing", () => {
    const result = evaluateCourseCompletion({
      ...base,
      completedLessonIds: ["l1", "l2", "l3"],
    });
    expect(result.eligible).toBe(false);
    expect(result.completedLessons).toBe(3);
    expect(result.requirements.find((entry) => entry.key === "lessons")?.met).toBe(false);
  });

  it("is not eligible without a quiz attempt, even with all lessons done", () => {
    const result = evaluateCourseCompletion({ ...base, attempts: [] });
    expect(result.eligible).toBe(false);
    expect(result.requirements.find((entry) => entry.key === "quiz")?.met).toBe(false);
    expect(result.finalScore).toBeNull();
  });

  it("uses the best attempt and ignores a failing best score", () => {
    const result = evaluateCourseCompletion({
      ...base,
      attempts: [
        { score: 60, passed: false },
        { score: 79, passed: false },
        { score: 40, passed: false },
      ],
    });
    expect(result.bestScore).toBe(79);
    expect(result.eligible).toBe(false);
    expect(result.requirements.find((entry) => entry.key === "score")?.met).toBe(false);
  });

  it("does not count duplicate lesson ids twice", () => {
    const result = evaluateCourseCompletion({
      ...base,
      completedLessonIds: ["l1", "l1", "l2", "l3"],
    });
    expect(result.completedLessons).toBe(3);
    expect(result.eligible).toBe(false);
  });

  it("is never eligible when the course has no quiz", () => {
    const result = evaluateCourseCompletion({ ...base, quizExists: false });
    expect(result.eligible).toBe(false);
    expect(result.requirements.find((entry) => entry.key === "quiz")?.met).toBe(false);
  });
});

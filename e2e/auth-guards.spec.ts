import { expect, test } from "@playwright/test";

const protectedRoutes = [
  "/dashboard",
  "/dashboard/certificates",
  "/learn/html-fundamentals",
  "/playground",
  "/ai-tutor",
  "/settings",
  "/courses/html-fundamentals/quiz",
  "/certificates/LC-2026-ABCDEFGH",
];

for (const route of protectedRoutes) {
  test(`unauthenticated visitor is redirected from ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(route)}`));
    await expect(page.getByRole("heading", { name: "Masuk ke LearnCode" })).toBeVisible();
  });
}

test("API routes reject unauthenticated completion attempts", async ({ request }) => {
  const lesson = await request.post(
    "/api/lessons/11111111-1111-4111-8111-111111111111/complete",
    { data: {} },
  );
  expect(lesson.status()).toBe(401);
  expect((await lesson.json()).error.code).toBe("unauthenticated");

  const quiz = await request.post(
    "/api/quizzes/11111111-1111-4111-8111-111111111111/submit",
    { data: { answers: {} } },
  );
  expect(quiz.status()).toBe(401);

  const course = await request.post(
    "/api/courses/11111111-1111-4111-8111-111111111111/complete",
  );
  expect(course.status()).toBe(401);

  const pdf = await request.get("/api/certificates/LC-2026-ABCDEFGH/pdf");
  expect(pdf.status()).toBe(401);

  const usage = await request.get("/api/ai/usage");
  expect(usage.status()).toBe(401);
});

test("AI chat refuses unauthenticated requests before calling the provider", async ({
  request,
}) => {
  const response = await request.post("/api/ai/chat", {
    data: { action: "free_chat", message: "Halo" },
  });
  expect(response.status()).toBe(401);
  const payload = await response.json();
  expect(payload.error.code).toBe("unauthenticated");
  // No provider details or stack traces leak in the error body.
  expect(JSON.stringify(payload)).not.toMatch(/groq|stack|api[_-]?key/i);
});

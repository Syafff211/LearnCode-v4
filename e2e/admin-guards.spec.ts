import { expect, test } from "@playwright/test";

const adminRoutes = [
  "/admin/dashboard",
  "/admin/courses",
  "/admin/courses/new",
  "/admin/lessons",
  "/admin/quizzes",
  "/admin/users",
  "/admin/certificates",
  "/admin/ai-settings",
  "/admin/settings",
  "/admin/audit-logs",
];

test("admin sign-in page is reachable without a session", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/admin/i);
  await expect(page.getByLabel("Email admin")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Masuk ke panel admin/ })).toBeVisible();
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/password.*(admin123|rahasia)/i);
});

for (const route of adminRoutes) {
  test(`unauthenticated visitor is sent to the admin sign-in for ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`/admin\\?next=${encodeURIComponent(route)}`));
    await expect(page.getByLabel("Email admin")).toBeVisible();
  });
}

test("admin certificate PDF requires an admin session", async ({ request }) => {
  const response = await request.get(
    "/api/admin/certificates/11111111-1111-4111-8111-111111111111/pdf",
  );
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.error.code).toBe("unauthenticated");
  expect(JSON.stringify(body)).not.toMatch(/service|token/i);
});

test("public verification page stays public", async ({ page }) => {
  await page.goto("/verify/kHd_mmYFFQSJ_RI4x0BwL3ik");
  await expect(page).toHaveURL(/\/verify\//);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

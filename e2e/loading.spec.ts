import { expect, test } from "@playwright/test";

test.describe("global loading screen integration", () => {
  test("does not block initial landing render and introduces no hydration warnings", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.addInitScript(() =>
      window.localStorage.setItem("learncode:intro-video", "seen"),
    );
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Belajar coding dengan membangun sesuatu/i,
      }),
    ).toBeVisible();

    await expect(page.locator('[data-loading-screen="true"]')).toHaveCount(0);

    const hydrationErrors = consoleErrors.filter((text) =>
      /hydration|did not match/i.test(text),
    );
    expect(hydrationErrors).toEqual([]);
  });

  test("shows centered /loading.gif on route navigation and dismisses cleanly when ready", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem("learncode:intro-video", "seen"),
    );
    await page.goto("/");

    await page.route("**/blog*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      await route.continue();
    });

    await page.getByRole("link", { name: /^Blog$/i }).first().click();

    const loadingScreen = page.locator('[data-loading-screen="true"]');
    await expect(loadingScreen).toBeVisible();
    await expect(loadingScreen).toHaveCSS("background-color", "rgb(250, 249, 245)");
    await expect(loadingScreen).toHaveText("");
    await expect(loadingScreen).toHaveAttribute("data-media-kind", "gif");
    await expect(loadingScreen.locator('img[src="/loading.gif"]')).toHaveCount(1);

    await expect(
      page.getByRole("heading", { level: 1, name: /Pahami konsep/i }),
    ).toBeVisible();
    await expect(loadingScreen).toHaveCount(0);
  });

  test("does not show loading on hash or query-only changes on the same route", async ({
    page,
  }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem("learncode:intro-video", "seen"),
    );
    await page.goto("/");

    await page.getByRole("link", { name: /Lihat materi/i }).first().click();
    await expect(page.locator('[data-loading-screen="true"]')).toHaveCount(0);
  });

  test("follows dark mode theme, supports mobile 360px, and respects prefers-reduced-motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 360, height: 800 });

    await page.addInitScript(() => {
      window.localStorage.setItem("learncode:intro-video", "seen");
      window.localStorage.setItem("learncode-theme", "dark");
    });
    await page.goto("/");

    await page.route("**/courses*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      await route.continue();
    });

    await page.getByRole("button", { name: /Buka menu navigasi/i }).click();
    await page.getByRole("link", { name: /^Courses$/i }).first().click();

    const loadingScreen = page.locator('[data-loading-screen="true"]');
    await expect(loadingScreen).toBeVisible();
    await expect(loadingScreen).toHaveCSS("background-color", "rgb(18, 19, 16)");
    await expect(loadingScreen).toHaveAttribute("data-media-kind", "fallback");
    await expect(loadingScreen).toHaveText("");

    await expect(
      page.getByRole("heading", { level: 1, name: /fondasi/i }),
    ).toBeVisible();
    await expect(loadingScreen).toHaveCount(0);
  });

  test("browser back navigation does not leave loading stuck", async ({ page }) => {
    await page.addInitScript(() =>
      window.localStorage.setItem("learncode:intro-video", "seen"),
    );
    await page.goto("/");
    await page.getByRole("link", { name: /^Courses$/i }).first().click();
    await expect(
      page.getByRole("heading", { level: 1, name: /fondasi/i }),
    ).toBeVisible();

    await page.goBack();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Belajar coding dengan membangun sesuatu/i,
      }),
    ).toBeVisible();
    await expect(page.locator('[data-loading-screen="true"]')).toHaveCount(0);
  });
});

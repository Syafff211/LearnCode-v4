import { expect, test } from "@playwright/test";

test.describe("loading screen integration", () => {
  test("does not block landing content once loaded and introduces no hydration warnings", async ({
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

    // Content is already ready, so the full-screen loading overlay stays hidden.
    await expect(page.locator('[data-loading-screen="true"]')).toHaveCount(0);

    const hydrationErrors = consoleErrors.filter((text) =>
      /hydration|did not match/i.test(text),
    );
    expect(hydrationErrors).toEqual([]);
  });

  test("falls back from loading.mp4 to loading.gif and stays centered on #FAF9F5 without visible text", async ({
    page,
  }) => {
    const tinyGif = Buffer.from(
      "R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64",
    );

    await page.route("**/loading.mp4", (route) =>
      route.fulfill({ status: 404, body: "Not found" }),
    );
    await page.route("**/loading.gif", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/gif",
        body: tinyGif,
      }),
    );

    await page.addInitScript(() =>
      window.localStorage.setItem("learncode:intro-video", "seen"),
    );
    await page.goto("/");

    // Simulate a slower client-side page transition (>150ms anti-flicker delay).
    await page.route("**/courses*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      await route.continue();
    });

    await page.getByRole("link", { name: /^Courses$/i }).first().click();

    const loadingScreen = page.locator('[data-loading-screen="true"]');
    await expect(loadingScreen).toBeVisible();
    await expect(loadingScreen).toHaveCSS("background-color", "rgb(250, 249, 245)");
    await expect(loadingScreen).toHaveText("");
    await expect(loadingScreen).toHaveAttribute("data-media-kind", "gif");

    // Automatically disappears when the navigation finishes.
    await expect(
      page.getByRole("heading", { level: 1, name: /fondasi/i }),
    ).toBeVisible();
    await expect(loadingScreen).toHaveCount(0);
  });

  test("respects prefers-reduced-motion and remains responsive on mobile", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript(() =>
      window.localStorage.setItem("learncode:intro-video", "seen"),
    );
    await page.goto("/");

    await page.route("**/courses*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      await route.continue();
    });

    await page.getByRole("button", { name: /Buka menu navigasi/i }).click();
    await page.getByRole("link", { name: /^Courses$/i }).first().click();

    const loadingScreen = page.locator('[data-loading-screen="true"]');
    await expect(loadingScreen).toBeVisible();
    await expect(loadingScreen).toHaveCSS("background-color", "rgb(250, 249, 245)");

    await expect(
      page.getByRole("heading", { level: 1, name: /fondasi/i }),
    ).toBeVisible();
    await expect(loadingScreen).toHaveCount(0);
  });
});

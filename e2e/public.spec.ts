import { expect, test } from "@playwright/test";

test.describe("public catalogue", () => {
  test("landing page explains the product without invented metrics", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Belajar coding dengan membangun sesuatu/i,
      }),
    ).toBeVisible();
    await expect(page.getByText("Learn by doing. Understand with AI.").first()).toBeVisible();

    await expect(page.getByRole("link", { name: /Jelajahi Kursus/i }).first()).toBeVisible();

    // No fake social proof or decorative statistic blocks.
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/testimonial|dipercaya oleh|partner|10\.000\+|lorem ipsum/i);
  });

  test("courses page lists the three real courses", async ({ page }) => {
    await page.goto("/courses");
    await expect(
      page.getByRole("heading", { level: 1, name: /fondasi/i }),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: /HTML Fundamentals/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /CSS Fundamentals/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /JavaScript Fundamentals/i }).first()).toBeVisible();
  });

  test("course detail shows objectives, lessons, and passing score", async ({ page }) => {
    await page.goto("/courses/html-fundamentals");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/HTML/i);
    await expect(page.getByText(/Nilai minimal 80%/).first()).toBeVisible();
    await expect(page.getByText(/Formulir yang aksesibel/i).first()).toBeVisible();
    await expect(page.getByText(/Yang akan kamu pelajari/i).first()).toBeVisible();

    // The quiz link is present but gated behind auth.
    const quizLink = page.getByRole("link", { name: /Quiz akhir kursus/i }).first();
    await expect(quizLink).toHaveAttribute("href", "/courses/html-fundamentals/quiz");
  });

  test("chapter links point at the learning workspace", async ({ page }) => {
    await page.goto("/courses/css-fundamentals");
    const lessonLink = page.getByRole("link", { name: /Selektor, cascade/i }).first();
    await expect(lessonLink).toHaveAttribute("href", "/learn/css-selektor-cascade");
  });
});

test.describe("public verification and errors", () => {
  test("an unknown verification code is inconclusive, not an error page", async ({ page }) => {
    await page.goto("/verify/abcdefghijklmnop12345678");
    await expect(page.getByRole("heading", { name: /Verifikasi sertifikat/i })).toBeVisible();
    await expect(page.getByText(/Kode tidak ditemukan/i)).toBeVisible();
    await expect(page.getByText(/Sertifikat terverifikasi/i)).toHaveCount(0);
  });

  test("unknown routes render the editorial not-found page", async ({ page }) => {
    const response = await page.goto("/halaman-yang-tidak-ada");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading")).toContainText(/tidak tersedia/i);
    await expect(page.getByRole("link", { name: /Beranda|Kembali/i }).first()).toBeVisible();
  });
});

test.describe("auth screens", () => {
  test("login page renders an accessible form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Masuk ke LearnCode" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Masuk$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Lupa password/i })).toBeVisible();
  });

  test("registration explains why email verification is needed", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Mulai belajar/i);
    await expect(page.getByLabel("Nama lengkap")).toBeVisible();
    await expect(page.getByText(/pendaftaran dengan email memerlukan kode verifikasi/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Masuk/i }).first()).toBeVisible();
  });

  test("reset-password without a recovery session is honest", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/password berhasil diubah/i);
  });
});

import { describe, expect, it } from "vitest";

import { resendSignupOtpSchema, signupOtpSchema } from "@/lib/validation/auth";

describe("signup email OTP validation", () => {
  it.each([
    { token: "123456", digits: 6 },
    { token: "12345678", digits: 8 },
    { token: "1234567890", digits: 10 },
  ])("accepts a numeric OTP of $digits digits", ({ token }) => {
    expect(
      signupOtpSchema.safeParse({
        email: "learner@example.com",
        token,
        next: "/dashboard",
      }).success,
    ).toBe(true);
  });

  it.each(["12345", "12345678901", "12ab56", "  "])("rejects malformed OTP %j", (token) => {
    expect(
      signupOtpSchema.safeParse({
        email: "learner@example.com",
        token,
      }).success,
    ).toBe(false);
  });

  it("rejects invalid email addresses", () => {
    expect(
      signupOtpSchema.safeParse({ email: "not-an-email", token: "123456" }).success,
    ).toBe(false);
  });

  it("accepts an email-only resend request and rejects invalid email", () => {
    expect(resendSignupOtpSchema.safeParse({ email: "learner@example.com" }).success).toBe(true);
    expect(resendSignupOtpSchema.safeParse({ email: "bad" }).success).toBe(false);
  });
});

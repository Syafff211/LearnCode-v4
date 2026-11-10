import { describe, expect, it } from "vitest";

import {
  certificateVerificationPath,
  certificateVerificationUrl,
  generateCertificateNumber,
  generateVerificationCode,
  isValidVerificationCode,
} from "@/lib/services/certificate-identity";

function fixedRandom(values: number[]) {
  return (size: number) => Uint8Array.from(values.slice(0, size));
}

describe("generateCertificateNumber", () => {
  it("uses the LC-YYYY-XXXXXXXX shape with an unambiguous alphabet", () => {
    const number = generateCertificateNumber(2026);
    expect(number).toMatch(/^LC-2026-[A-HJ-NP-Z2-9]{8}$/);
    const suffix = number.slice("LC-2026-".length);
    expect(suffix).not.toMatch(/[IO01]/);
  });

  it("is deterministic for a given random source", () => {
    const random = fixedRandom([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(generateCertificateNumber(2026, random)).toBe(
      generateCertificateNumber(2026, random),
    );
  });

  it("can produce different suffixes", () => {
    const first = generateCertificateNumber(2026, fixedRandom([1, 1, 1, 1, 1, 1, 1, 1]));
    const second = generateCertificateNumber(2026, fixedRandom([2, 2, 2, 2, 2, 2, 2, 2]));
    expect(first).not.toBe(second);
  });
});

describe("generateVerificationCode", () => {
  it("produces a URL-safe code that passes validation", () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(code.length).toBeGreaterThanOrEqual(16);
    expect(isValidVerificationCode(code)).toBe(true);
  });

  it("does not repeat codes for distinct random sources", () => {
    const a = generateVerificationCode(fixedRandom(Array(18).fill(1)));
    const b = generateVerificationCode(fixedRandom(Array(18).fill(2)));
    expect(a).not.toBe(b);
  });
});

describe("isValidVerificationCode", () => {
  it.each(["short", "", "has space in code", "slash/code", "é".repeat(20)])(
    "rejects %s",
    (value) => {
      expect(isValidVerificationCode(value)).toBe(false);
    },
  );

  it("accepts a 24-character base64url string", () => {
    expect(isValidVerificationCode("AbCdEfGhIjKlMnOpQrStUv12")).toBe(true);
  });

  it("rejects overlong input to bound database lookups", () => {
    expect(isValidVerificationCode("a".repeat(65))).toBe(false);
  });
});

describe("verification URLs", () => {
  it("builds a public path without auth", () => {
    expect(certificateVerificationPath("abc123")).toBe("/verify/abc123");
    expect(certificateVerificationUrl("https://learncode.example", "abc123")).toBe(
      "https://learncode.example/verify/abc123",
    );
  });

  it("does not double slashes when the app URL has a trailing slash", () => {
    expect(certificateVerificationUrl("https://learncode.example/", "abc123")).toBe(
      "https://learncode.example/verify/abc123",
    );
  });
});

import { randomBytes } from "node:crypto";

/**
 * Certificate identifiers.
 *
 * certificate_number: human-readable, e.g. LC-2026-7KQ2M9XA
 * verification_code:  unguessable, URL-safe, stored with a UNIQUE constraint
 */

const NUMBER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

export function generateCertificateNumber(
  year: number,
  random: (size: number) => Uint8Array = randomBytes,
): string {
  const bytes = random(8);
  let suffix = "";
  for (let i = 0; i < 8; i += 1) {
    const byte = bytes[i] ?? 0;
    suffix += NUMBER_ALPHABET[byte % NUMBER_ALPHABET.length];
  }
  return `LC-${year}-${suffix}`;
}

export function generateVerificationCode(
  random: (size: number) => Uint8Array = randomBytes,
): string {
  return Buffer.from(random(18)).toString("base64url");
}

export function certificateVerificationPath(verificationCode: string): string {
  return `/verify/${verificationCode}`;
}

export function certificateVerificationUrl(
  appUrl: string,
  verificationCode: string,
): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}${certificateVerificationPath(verificationCode)}`;
}

export function isValidVerificationCode(value: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(value);
}

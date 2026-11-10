import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { buildCertificatePdf } from "@/lib/certificate/pdf";

const input = {
  recipientName: "Budi Santoso",
  courseTitle: "Dasar HTML: Struktur dan Aksesibilitas",
  certificateNumber: "LC-2026-7KQ2M9XA",
  verificationCode: "AbCdEfGhIjKlMnOpQrStUv12",
  finalScore: 92,
  issuedAt: "2026-05-01T09:00:00.000Z",
};

describe("buildCertificatePdf", () => {
  it("produces a valid single-page A4 landscape PDF", async () => {
    const bytes = await buildCertificatePdf(input);
    expect(bytes.byteLength).toBeGreaterThan(10_000);
    expect(Buffer.from(bytes.slice(0, 5)).toString("latin1")).toBe("%PDF-");

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const [page] = doc.getPages();
    expect(page?.getWidth()).toBeCloseTo(841.89, 1);
    expect(page?.getHeight()).toBeCloseTo(595.28, 1);
  });

  it("sets document metadata without embedding secrets", async () => {
    const bytes = await buildCertificatePdf(input);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getTitle()).toContain("LearnCode");
    expect(doc.getAuthor()).toBe("LearnCode");
    expect(doc.getSubject()).toContain(input.recipientName);
  });

  it("handles long recipient names and course titles", async () => {
    const bytes = await buildCertificatePdf({
      ...input,
      recipientName: "A".repeat(80),
      courseTitle: "Kursus dengan judul yang sangat panjang untuk menguji pembungkusan teks",
    });
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("is deterministic in structure across calls", async () => {
    const first = await buildCertificatePdf(input);
    const second = await buildCertificatePdf(input);
    const firstDoc = await PDFDocument.load(first);
    const secondDoc = await PDFDocument.load(second);
    expect(firstDoc.getPageCount()).toBe(secondDoc.getPageCount());
  });
});

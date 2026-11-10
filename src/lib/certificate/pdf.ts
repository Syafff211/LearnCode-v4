import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

import { getAppUrl } from "@/lib/env";

export type CertificatePdfInput = {
  recipientName: string;
  courseTitle: string;
  certificateNumber: string;
  verificationCode: string;
  finalScore: number;
  issuedAt: string | Date;
  /** Optional presentation values from platform settings. */
  platformName?: string;
  signature?: string;
};

const COLORS = {
  paper: rgb(0.98, 0.976, 0.961),
  ink: rgb(0.098, 0.094, 0.078),
  inkSoft: rgb(0.247, 0.239, 0.212),
  muted: rgb(0.416, 0.404, 0.369),
  accent: rgb(0.118, 0.298, 0.239),
  accentSoft: rgb(0.91, 0.941, 0.918),
  line: rgb(0.796, 0.773, 0.714),
  white: rgb(1, 1, 1),
};

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

type Fonts = {
  serif: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
};

const fontDir = path.join(process.cwd(), "src/lib/certificate/fonts");

async function loadFonts(doc: PDFDocument): Promise<Fonts> {
  const read = async (file: string) => readFile(path.join(fontDir, file));
  const [serif, serifBold, serifItalic, sans, sansBold] = await Promise.all([
    read("IBMPlexSerif-Regular.ttf"),
    read("IBMPlexSerif-Bold.ttf"),
    read("IBMPlexSerif-Italic.ttf"),
    read("PTSans-Regular.ttf"),
    read("PTSans-Bold.ttf"),
  ]);
  return {
    serif: await doc.embedFont(serif, { subset: true }),
    serifBold: await doc.embedFont(serifBold, { subset: true }),
    serifItalic: await doc.embedFont(serifItalic, { subset: true }),
    sans: await doc.embedFont(sans, { subset: true }),
    sansBold: await doc.embedFont(sansBold, { subset: true }),
  };
}

function clean(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  maxLines = 2,
): string[] {
  const words = clean(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current.length > 0) lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) break;
  }
  if (current.length > 0 && lines.length < maxLines) lines.push(current);

  // If the remaining text did not fit, add an ellipsis to the last line.
  const joinedLength = lines.join(" ").length;
  if (joinedLength < clean(text).length && lines.length > 0) {
    const last = lines[lines.length - 1] ?? "";
    lines[lines.length - 1] = `${last.replace(/[.,;:]$/, "")}…`;
  }
  return lines;
}

/** Fit a single line by reducing size down to a floor. */
function fitFontSize(
  text: string,
  font: PDFFont,
  maxWidth: number,
  preferred: number,
  floor: number,
): number {
  let size = preferred;
  while (size > floor && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 1;
  }
  return size;
}

function drawTracked(
  page: PDFPage,
  text: string,
  options: {
    x: number;
    y: number;
    font: PDFFont;
    size: number;
    tracking: number;
    color: ReturnType<typeof rgb>;
  },
) {
  let cursor = options.x;
  for (const char of text) {
    page.drawText(char, {
      x: cursor,
      y: options.y,
      size: options.size,
      font: options.font,
      color: options.color,
    });
    cursor += options.font.widthOfTextAtSize(char, options.size) + options.tracking;
  }
  return cursor;
}

function drawTrackedRight(
  page: PDFPage,
  text: string,
  options: {
    right: number;
    y: number;
    font: PDFFont;
    size: number;
    tracking: number;
    color: ReturnType<typeof rgb>;
  },
) {
  let width = 0;
  for (const char of text) {
    width += options.font.widthOfTextAtSize(char, options.size) + options.tracking;
  }
  return drawTracked(page, text, {
    x: options.right - width + options.tracking,
    y: options.y,
    font: options.font,
    size: options.size,
    tracking: options.tracking,
    color: options.color,
  });
}

function formatIssueDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

async function qrPng(url: string): Promise<Uint8Array> {
  const buffer = await QRCode.toBuffer(url, {
    type: "png",
    margin: 1,
    width: 512,
    errorCorrectionLevel: "M",
    color: { dark: "#1E4C3D", light: "#FFFFFF" },
  });
  return new Uint8Array(buffer);
}

export async function buildCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fonts = await loadFonts(doc);

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const verifyUrl = `${getAppUrl()}/verify/${input.verificationCode}`;

  // Paper + double rule
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: COLORS.paper,
  });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: PAGE_WIDTH - 48,
    height: PAGE_HEIGHT - 48,
    borderColor: COLORS.accent,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: 31,
    y: 31,
    width: PAGE_WIDTH - 62,
    height: PAGE_HEIGHT - 62,
    borderColor: COLORS.line,
    borderWidth: 0.6,
  });

  const left = 64;
  const right = PAGE_WIDTH - 64;

  // Brand mark
  page.drawRectangle({ x: left, y: PAGE_HEIGHT - 70, width: 22, height: 22, color: COLORS.accent });
  const markCenterX = left + 6.2;
  page.drawLine({
    start: { x: markCenterX, y: PAGE_HEIGHT - 58 },
    end: { x: markCenterX + 3.6, y: PAGE_HEIGHT - 62.4 },
    thickness: 1.3,
    color: COLORS.paper,
  });
  page.drawLine({
    start: { x: markCenterX + 3.6, y: PAGE_HEIGHT - 62.4 },
    end: { x: markCenterX, y: PAGE_HEIGHT - 66.8 },
    thickness: 1.3,
    color: COLORS.paper,
  });
  page.drawLine({
    start: { x: markCenterX + 8.5, y: PAGE_HEIGHT - 60 },
    end: { x: markCenterX + 11.5, y: PAGE_HEIGHT - 60 },
    thickness: 1.3,
    color: COLORS.paper,
  });
  page.drawText("LearnCode", {
    x: left + 30,
    y: PAGE_HEIGHT - 66,
    size: 17,
    font: fonts.serifBold,
    color: COLORS.ink,
  });

  drawTrackedRight(page, "CERTIFICATE OF COMPLETION", {
    right,
    y: PAGE_HEIGHT - 62,
    font: fonts.sansBold,
    size: 7.6,
    tracking: 1.35,
    color: COLORS.muted,
  });

  page.drawLine({
    start: { x: left, y: PAGE_HEIGHT - 92 },
    end: { x: right, y: PAGE_HEIGHT - 92 },
    thickness: 0.7,
    color: COLORS.line,
  });

  // Main copy
  drawTracked(page, "SERTIFIKAT PENYELESAIAN KURSUS", {
    x: left,
    y: PAGE_HEIGHT - 132,
    font: fonts.sansBold,
    size: 7.6,
    tracking: 1.5,
    color: COLORS.accent,
  });

  const nameMaxWidth = 470;
  const nameLines = wrapText(input.recipientName || "Pelajar LearnCode", fonts.serifBold, 42, nameMaxWidth, 2);
  const nameSize = Math.min(
    42,
    ...nameLines.map((line) => fitFontSize(line, fonts.serifBold, nameMaxWidth, 42, 22)),
  );
  let nameY = PAGE_HEIGHT - 186;
  nameLines.forEach((line, index) => {
    page.drawText(line, {
      x: left,
      y: nameY - index * nameSize * 1.16,
      size: nameSize,
      font: fonts.serifBold,
      color: COLORS.ink,
    });
  });
  nameY -= (nameLines.length - 1) * nameSize * 1.16;

  page.drawRectangle({
    x: left,
    y: nameY - 22,
    width: 52,
    height: 2,
    color: COLORS.accent,
  });

  page.drawText("telah berhasil menyelesaikan kursus", {
    x: left,
    y: nameY - 50,
    size: 10.5,
    font: fonts.sans,
    color: COLORS.muted,
  });

  const courseLines = wrapText(input.courseTitle, fonts.serif, 24, 470, 2);
  courseLines.forEach((line, index) => {
    page.drawText(line, {
      x: left,
      y: nameY - 80 - index * 30,
      size: 24,
      font: fonts.serif,
      color: COLORS.inkSoft,
    });
  });
  const courseBottom = nameY - 80 - (courseLines.length - 1) * 30;

  page.drawText(
    "Sebagai bukti penyelesaian seluruh lesson dan quiz dengan nilai yang memenuhi syarat kelulusan.",
    {
      x: left,
      y: courseBottom - 26,
      size: 8.8,
      font: fonts.sans,
      color: COLORS.muted,
      maxWidth: 460,
      lineHeight: 12,
    },
  );

  // Score chip
  const scoreText = `NILAI AKHIR  ${Math.round(input.finalScore)}%`;
  const scoreWidth = fonts.sansBold.widthOfTextAtSize(scoreText, 8.2) + 22;
  page.drawRectangle({
    x: left,
    y: courseBottom - 72,
    width: scoreWidth,
    height: 24,
    color: COLORS.accentSoft,
  });
  page.drawText(scoreText, {
    x: left + 11,
    y: courseBottom - 64.5,
    size: 8.2,
    font: fonts.sansBold,
    color: COLORS.accent,
  });

  // Metadata row
  const metaY = 148;
  page.drawText("DITERBITKAN", {
    x: left,
    y: metaY + 22,
    size: 6.8,
    font: fonts.sansBold,
    color: COLORS.muted,
  });
  page.drawText(formatIssueDate(input.issuedAt), {
    x: left,
    y: metaY + 9,
    size: 10,
    font: fonts.sans,
    color: COLORS.inkSoft,
  });

  page.drawText("NOMOR SERTIFIKAT", {
    x: left + 190,
    y: metaY + 22,
    size: 6.8,
    font: fonts.sansBold,
    color: COLORS.muted,
  });
  page.drawText(input.certificateNumber, {
    x: left + 190,
    y: metaY + 9,
    size: 10,
    font: fonts.sans,
    color: COLORS.inkSoft,
  });

  // Signature block
  page.drawLine({
    start: { x: left, y: 78 },
    end: { x: left + 168, y: 78 },
    thickness: 0.7,
    color: COLORS.line,
  });
  const signature = (input.signature ?? "Tim LearnCode").slice(0, 80);
  const platformName = (input.platformName ?? "LearnCode").slice(0, 60);
  let signatureSize = 15;
  while (
    signatureSize > 9 &&
    fonts.serifItalic.widthOfTextAtSize(signature, signatureSize) > 168
  ) {
    signatureSize -= 0.5;
  }
  page.drawText(signature, {
    x: left,
    y: 84,
    size: signatureSize,
    font: fonts.serifItalic,
    color: COLORS.accent,
  });
  page.drawText(`Platform pembelajaran · ${platformName}`, {
    x: left,
    y: 64,
    size: 7.2,
    font: fonts.sans,
    color: COLORS.muted,
  });

  // Right verification panel
  const panelX = 612;
  page.drawLine({
    start: { x: panelX, y: PAGE_HEIGHT - 120 },
    end: { x: panelX, y: 120 },
    thickness: 0.6,
    color: COLORS.line,
  });

  const qrBytes = await qrPng(verifyUrl);
  const qrImage = await doc.embedPng(qrBytes);
  const qrSize = 118;
  const qrX = panelX + 40;
  const qrY = PAGE_HEIGHT - 305;
  page.drawRectangle({
    x: qrX - 8,
    y: qrY - 8,
    width: qrSize + 16,
    height: qrSize + 16,
    color: COLORS.white,
    borderColor: COLORS.line,
    borderWidth: 0.6,
  });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  drawTracked(page, "VERIFIKASI SERTIFIKAT", {
    x: qrX - 8,
    y: qrY - 32,
    font: fonts.sansBold,
    size: 7,
    tracking: 1.1,
    color: COLORS.muted,
  });

  page.drawText("Pindai QR atau kunjungi halaman verifikasi", {
    x: qrX - 8,
    y: qrY - 47,
    size: 7.6,
    font: fonts.sans,
    color: COLORS.inkSoft,
  });

  const codeLines = wrapText(input.verificationCode, fonts.sans, 7.2, qrSize + 12, 2);
  codeLines.forEach((line, index) => {
    page.drawText(line, {
      x: qrX - 8,
      y: qrY - 64 - index * 10,
      size: 7.2,
      font: fonts.sans,
      color: COLORS.muted,
    });
  });

  // Bottom rule and legal note
  page.drawLine({
    start: { x: left, y: 46 },
    end: { x: right, y: 46 },
    thickness: 0.6,
    color: COLORS.line,
  });
  page.drawText(
    "Sertifikat ini merupakan bukti penyelesaian kursus di LearnCode dan bukan akreditasi lembaga eksternal. Keaslian dapat diverifikasi melalui halaman publik LearnCode.",
    {
      x: left,
      y: 44,
      size: 6.4,
      font: fonts.sans,
      color: COLORS.muted,
      maxWidth: 610,
      lineHeight: 8,
    },
  );
  page.drawText(`${getAppUrl()}/verify`, {
    x: right - fonts.sans.widthOfTextAtSize(`${getAppUrl()}/verify`, 6.4),
    y: 44,
    size: 6.4,
    font: fonts.sans,
    color: COLORS.muted,
  });

  doc.setTitle(`Sertifikat ${input.courseTitle} — LearnCode`);
  doc.setAuthor("LearnCode");
  doc.setSubject(
    `Bukti penyelesaian kursus ${input.courseTitle} oleh ${input.recipientName}`,
  );
  doc.setCreator("LearnCode");
  doc.setProducer("LearnCode · pdf-lib");
  doc.setCreationDate(new Date());

  return doc.save();
}

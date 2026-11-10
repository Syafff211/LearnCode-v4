export const SITE_ORIGIN = "https://learncode.web.id";
export const SITE_NAME = "LearnCode";
export const DEFAULT_SITE_DESCRIPTION =
  "Belajar HTML, CSS, dan JavaScript melalui materi praktik, playground kode, quiz, dan AI Tutor.";

/** Build an absolute production canonical URL from a site-relative path. */
export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_ORIGIN).toString();
}

/** Escaping for JSON-LD embedded inside an HTML script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case "<":
        return "\\u003c";
      case ">":
        return "\\u003e";
      case "&":
        return "\\u0026";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return character;
    }
  });
}

export function formatBlogDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function blogAuthorName(value: string | null | undefined): string {
  const author = value?.trim();
  return author || "LearnCode";
}

export function isPublicationDateReached(value: string | null): boolean {
  if (!value) return false;
  const publishedAt = new Date(value).getTime();
  return Number.isFinite(publishedAt) && publishedAt <= Date.now();
}

import { serializeJsonLd } from "@/lib/seo";

/** Structured data is built from the real page content passed by the server. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

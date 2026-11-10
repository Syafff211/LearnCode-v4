import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { canonicalUrl } from "@/lib/seo";

export function PageBreadcrumbs({
  label,
  path,
}: {
  label: string;
  path: `/${string}`;
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              Beranda
            </Link>
          </li>
          <li aria-hidden="true" className="text-line-strong">
            /
          </li>
          <li aria-current="page" className="font-medium text-ink-soft">
            {label}
          </li>
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Beranda",
              item: canonicalUrl("/"),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: label,
              item: canonicalUrl(path),
            },
          ],
        }}
      />
    </>
  );
}

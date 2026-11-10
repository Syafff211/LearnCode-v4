import Link from "next/link";

import type { BlogCategory } from "@/lib/data/blog";

export function BlogCategoryPills({
  categories,
  activeSlug,
}: {
  categories: BlogCategory[];
  activeSlug?: string;
}) {
  return (
    <nav aria-label="Kategori blog" className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        aria-current={!activeSlug ? "page" : undefined}
        className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs transition-colors motion-reduce:transition-none ${
          !activeSlug
            ? "border-accent bg-accent text-accent-ink"
            : "border-line-strong bg-surface text-ink-soft hover:bg-surface-2"
        }`}
      >
        Semua artikel
      </Link>
      {categories.map((category) => {
        const active = activeSlug === category.slug;
        return (
          <Link
            key={category.id}
            href={`/blog/category/${category.slug}`}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs transition-colors motion-reduce:transition-none ${
              active
                ? "border-accent bg-accent text-accent-ink"
                : "border-line-strong bg-surface text-ink-soft hover:bg-surface-2"
            }`}
          >
            {category.name}
          </Link>
        );
      })}
    </nav>
  );
}

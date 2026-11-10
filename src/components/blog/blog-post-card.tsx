import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { BlogPostSummary } from "@/lib/data/blog";
import { formatBlogDate } from "@/lib/blog-utils";

export function BlogPostCard({ post, featured = false }: { post: BlogPostSummary; featured?: boolean }) {
  const coverImage = post.cover_image;
  const coverImagePath = post.cover_image_path;
  const coverImageAlt = post.cover_image_alt;
  if (!coverImage || !coverImagePath || !coverImageAlt || coverImageAlt.trim().length < 5) return null;

  return (
    <article className="group h-full rounded-[8px] border border-line bg-surface transition-colors hover:border-line-strong">
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text">
        <div className={`relative w-full overflow-hidden rounded-t-[7px] ${featured ? "aspect-[16/8]" : "aspect-[16/9]"}`}>
          <Image
            src={coverImage}
            alt={coverImageAlt}
            fill
            sizes={featured ? "(max-width: 1024px) 100vw, 65vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            priority={featured}
            className="object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
            {post.category ? <span className="font-medium text-accent-text">{post.category.name}</span> : null}
            {post.published_at ? <span aria-hidden="true">·</span> : null}
            {post.published_at ? <time dateTime={post.published_at}>{formatBlogDate(post.published_at)}</time> : null}
            <span aria-hidden="true">·</span>
            <span>{post.reading_minutes} menit baca</span>
          </div>
          <h2 className={`mt-2 font-display font-semibold leading-snug text-ink group-hover:text-accent-text ${featured ? "text-xl sm:text-2xl" : "text-lg"}`}>
            {post.title}
          </h2>
          <p className={`mt-2 text-sm leading-relaxed text-muted ${featured ? "max-w-2xl" : "line-clamp-3"}`}>
            {post.excerpt}
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-medium text-accent-text">
            Baca artikel
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}

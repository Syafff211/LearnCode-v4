import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCategoryPills } from "@/components/blog/blog-category-pills";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getPublicBlogCategories,
  getPublicBlogCategoryBySlug,
  getPublishedBlogPosts,
} from "@/lib/data/blog";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function getCategoryPageData(slug: string) {
  const category = await getPublicBlogCategoryBySlug(slug);
  if (!category) return null;
  const posts = await getPublishedBlogPosts({ limit: 100, categoryId: category.id });
  if (posts.length === 0) return null;
  return { category, posts };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryPageData(slug);
  if (!result) {
    return { title: "Kategori tidak ditemukan", robots: { index: false, follow: false } };
  }
  const path = `/blog/category/${result.category.slug}`;
  const description =
    result.category.description || `Artikel LearnCode tentang ${result.category.name}, disertai contoh dan tautan materi terkait.`;
  return {
    title: `${result.category.name} — artikel coding`,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${result.category.name} — artikel coding | LearnCode`,
      description,
      url: canonicalUrl(path),
      type: "website",
      siteName: "LearnCode",
      locale: "id_ID",
      ...(result.posts[0]?.cover_image && result.posts[0].cover_image_alt
        ? { images: [{ url: result.posts[0].cover_image, alt: result.posts[0].cover_image_alt }] }
        : {}),
    },
    twitter: {
      card: result.posts[0]?.cover_image ? "summary_large_image" : "summary",
      title: `${result.category.name} — artikel coding`,
      description,
      ...(result.posts[0]?.cover_image && result.posts[0].cover_image_alt
        ? { images: [{ url: result.posts[0].cover_image, alt: result.posts[0].cover_image_alt }] }
        : {}),
    },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [result, categories] = await Promise.all([
    getCategoryPageData(slug),
    getPublicBlogCategories(),
  ]);
  if (!result) notFound();
  const { category, posts } = result;
  const path = `/blog/category/${category.slug}`;
  const description = category.description || `Artikel LearnCode tentang ${category.name}.`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              name: `${category.name} — artikel coding`,
              description,
              url: canonicalUrl(path),
              inLanguage: "id-ID",
              mainEntity: posts.map((post) => ({
                "@type": "BlogPosting",
                headline: post.title,
                ...(post.cover_image && post.cover_image_alt
                  ? { image: [{ "@type": "ImageObject", url: post.cover_image, caption: post.cover_image_alt, width: 1200, height: 675 }] }
                  : {}),
                url: canonicalUrl(`/blog/${post.slug}`),
                datePublished: post.published_at ?? undefined,
                dateModified: post.updated_at,
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Beranda", item: canonicalUrl("/") },
                { "@type": "ListItem", position: 2, name: "Blog", item: canonicalUrl("/blog") },
                { "@type": "ListItem", position: 3, name: category.name, item: canonicalUrl(path) },
              ],
            },
          ],
        }}
      />
      <section className="border-b border-line">
        <div className="container-lc py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <li><Link href="/" className="hover:text-ink">Beranda</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/blog" className="hover:text-ink">Blog</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">{category.name}</li>
            </ol>
          </nav>
          <p className="eyebrow">Kategori</p>
          <h1 className="display-section mt-3">{category.name}</h1>
          <p className="lead mt-3 max-w-2xl">{description}</p>
          <div className="mt-6"><BlogCategoryPills categories={categories} activeSlug={category.slug} /></div>
        </div>
      </section>
      <section className="container-lc py-9 sm:py-12" aria-label={`Artikel kategori ${category.name}`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
        </div>
      </section>
    </>
  );
}

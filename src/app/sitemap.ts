import type { MetadataRoute } from "next";

import { getCatalogCourses } from "@/lib/data/courses";
import { getPublicBlogCategories, getPublishedBlogPosts } from "@/lib/data/blog";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, posts, categories] = await Promise.all([
    getCatalogCourses(),
    getPublishedBlogPosts({ limit: 5000 }),
    getPublicBlogCategories(),
  ]);

  const categoryIdsWithArticles = new Set(posts.map((post) => post.category_id));
  const visibleCategories = categories.filter((category) => categoryIdsWithArticles.has(category.id));
  const categoryLastModified = new Map<string, Date>();
  for (const post of posts) {
    const current = categoryLastModified.get(post.category_id);
    const updated = new Date(post.updated_at);
    if (!current || updated > current) categoryLastModified.set(post.category_id, updated);
  }

  return [
    {
      url: canonicalUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: canonicalUrl("/courses"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...courses.map((course) => ({
      url: canonicalUrl(`/courses/${course.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: canonicalUrl("/blog"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...visibleCategories.map((category) => ({
      url: canonicalUrl(`/blog/category/${category.slug}`),
      lastModified: categoryLastModified.get(category.id),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: canonicalUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

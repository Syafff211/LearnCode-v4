import "server-only";

import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type BlogCourseLink = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
};

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author_name: string | null;
  cover_image: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  category_id: string;
  reading_minutes: number;
  published_at: string | null;
  updated_at: string;
  seo_title: string | null;
  seo_description: string | null;
  category: BlogCategory | null;
  related_course: BlogCourseLink | null;
};

export type BlogPost = BlogPostSummary & {
  content_md: string;
  status: "draft" | "published" | "archived";
  related_course_id: string | null;
};

const BLOG_POST_SELECT =
  "id, slug, title, excerpt, author_name, cover_image, cover_image_path, cover_image_alt, category_id, reading_minutes, published_at, updated_at, seo_title, seo_description, content_md, status, related_course_id, category:blog_categories!blog_posts_category_id_fkey (id, name, slug, description), related_course:courses!blog_posts_related_course_id_fkey (id, slug, title, tagline)";

function hasPublicConfig(): boolean {
  return isSupabaseConfigured();
}

function reportReadError(operation: string, message: string) {
  console.error(`[blog] ${operation} failed`, message);
}

function hasValidPublicCover(
  post: Pick<BlogPostSummary, "cover_image" | "cover_image_path" | "cover_image_alt">,
): boolean {
  if (!post.cover_image || !post.cover_image_path || (post.cover_image_alt?.trim().length ?? 0) < 5) return false;
  if (!/^[0-9a-f-]{36}\/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f-]{36}\.webp$/i.test(post.cover_image_path)) return false;
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const expected = new URL(config.url);
    const image = new URL(post.cover_image);
    return image.origin === expected.origin && image.pathname.includes("/storage/v1/object/public/blog-covers/");
  } catch {
    return false;
  }
}

export async function getPublishedBlogPosts(options: {
  limit?: number;
  categoryId?: string;
  excludeId?: string;
} = {}): Promise<BlogPostSummary[]> {
  if (!hasPublicConfig()) return [];
  try {
    const db = await createSupabaseServerClient();
    let query = db
      .from("blog_posts")
      .select(BLOG_POST_SELECT)
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .not("cover_image_path", "is", null)
      .not("cover_image", "is", null)
      .not("cover_image_alt", "is", null)
      .order("published_at", { ascending: false });
    if (options.categoryId) query = query.eq("category_id", options.categoryId);
    if (options.excludeId) query = query.neq("id", options.excludeId);
    const limit = Math.min(Math.max(options.limit ?? 12, 1), 5000);
    const { data, error } = await query.limit(limit);
    if (error) {
      reportReadError("published posts", error.message);
      return [];
    }
    return ((data ?? []) as unknown as BlogPostSummary[]).filter(hasValidPublicCover);
  } catch (error) {
    reportReadError("published posts", error instanceof Error ? error.message : "unknown error");
    return [];
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasPublicConfig()) return null;
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db
      .from("blog_posts")
      .select(BLOG_POST_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .not("cover_image_path", "is", null)
      .not("cover_image", "is", null)
      .not("cover_image_alt", "is", null)
      .maybeSingle();
    if (error) {
      reportReadError("published post detail", error.message);
      return null;
    }
    const post = (data as unknown as BlogPost | null) ?? null;
    return post && hasValidPublicCover(post) ? post : null;
  } catch (error) {
    reportReadError("published post detail", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

export async function getPublicBlogCategoryBySlug(slug: string): Promise<BlogCategory | null> {
  if (!hasPublicConfig()) return null;
  try {
    const db = await createSupabaseServerClient();
    const { data, error } = await db
      .from("blog_categories")
      .select("id, name, slug, description")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      reportReadError("public category", error.message);
      return null;
    }
    return (data as BlogCategory | null) ?? null;
  } catch (error) {
    reportReadError("public category", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}

export async function getPublicBlogCategories(): Promise<BlogCategory[]> {
  if (!hasPublicConfig()) return [];
  try {
    const db = await createSupabaseServerClient();
    const { data: postRows, error: postError } = await db
      .from("blog_posts")
      .select("category_id, cover_image, cover_image_path, cover_image_alt")
      .eq("status", "published")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .not("cover_image_path", "is", null)
      .not("cover_image", "is", null)
      .not("cover_image_alt", "is", null)
      .limit(5000);
    if (postError) {
      reportReadError("public categories", postError.message);
      return [];
    }
    const categoryIds = Array.from(new Set(
      (postRows ?? [])
        .filter((row) => hasValidPublicCover(row as Pick<BlogPostSummary, "cover_image" | "cover_image_path" | "cover_image_alt">))
        .map((row) => row.category_id as string),
    ));
    if (categoryIds.length === 0) return [];

    const { data, error } = await db
      .from("blog_categories")
      .select("id, name, slug, description")
      .in("id", categoryIds)
      .order("name", { ascending: true });
    if (error) {
      reportReadError("public categories", error.message);
      return [];
    }
    return (data ?? []) as BlogCategory[];
  } catch (error) {
    reportReadError("public categories", error instanceof Error ? error.message : "unknown error");
    return [];
  }
}

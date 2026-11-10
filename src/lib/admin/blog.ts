import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ADMIN_PAGE_SIZE } from "@/lib/validation/admin";
import type { BlogCategory, BlogPost } from "@/lib/data/blog";

export type AdminBlogListRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  author_name: string | null;
  reading_minutes: number;
  published_at: string | null;
  updated_at: string;
  category_id: string;
  category: Pick<BlogCategory, "id" | "name" | "slug"> | null;
};

export type AdminBlogPost = BlogPost & {
  created_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export async function listBlogCategories(db: SupabaseClient): Promise<BlogCategory[]> {
  const { data, error } = await db
    .from("blog_categories")
    .select("id, name, slug, description")
    .order("name", { ascending: true });
  if (error) {
    console.error("[admin] blog categories failed", error.message);
    return [];
  }
  return (data ?? []) as BlogCategory[];
}

export async function listPublishedCourseOptions(
  db: SupabaseClient,
): Promise<{ id: string; title: string; slug: string }[]> {
  const { data, error } = await db
    .from("courses")
    .select("id, title, slug")
    .eq("status", "published")
    .order("position", { ascending: true });
  if (error) {
    console.error("[admin] blog course options failed", error.message);
    return [];
  }
  return (data ?? []) as { id: string; title: string; slug: string }[];
}

export async function listAdminBlogPosts(
  db: SupabaseClient,
  params: { q: string; status: string; categoryId: string; page: number },
): Promise<{ rows: AdminBlogListRow[]; total: number }> {
  const from = (params.page - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;
  let query = db
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, status, author_name, reading_minutes, published_at, updated_at, category_id, category:blog_categories!blog_posts_category_id_fkey (id, name, slug)",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.status !== "all") query = query.eq("status", params.status);
  if (params.categoryId) query = query.eq("category_id", params.categoryId);
  if (params.q) {
    const escaped = params.q.replace(/[\\%_]/g, "\\$&");
    query = query.or(`title.ilike.%${escaped}%,slug.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[admin] blog list failed", error.message);
    return { rows: [], total: 0 };
  }
  return { rows: (data ?? []) as unknown as AdminBlogListRow[], total: count ?? 0 };
}

export async function getAdminBlogPost(db: SupabaseClient, postId: string): Promise<AdminBlogPost | null> {
  const { data, error } = await db
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, content_md, status, author_name, cover_image, cover_image_path, cover_image_alt, category_id, reading_minutes, published_at, updated_at, created_at, seo_title, seo_description, related_course_id, created_by, updated_by, category:blog_categories!blog_posts_category_id_fkey (id, name, slug, description), related_course:courses!blog_posts_related_course_id_fkey (id, slug, title, tagline)",
    )
    .eq("id", postId)
    .maybeSingle();
  if (error) {
    console.error("[admin] blog detail failed", error.message);
    return null;
  }
  return (data as unknown as AdminBlogPost | null) ?? null;
}

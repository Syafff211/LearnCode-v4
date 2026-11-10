"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminAction } from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/audit";
import {
  adminErrorState,
  checkAdminRateLimit,
  requiredString,
  zodFieldErrors,
  type AdminActionState,
} from "@/lib/actions/admin-shared";
import { blogPublishBlockers, parseBlogPostForm, blogPostInputSchema } from "@/lib/validation/blog";
import type { BlogPostInput, BlogPostStatus } from "@/lib/validation/blog";
import { getSupabaseConfig } from "@/lib/env";

const BLOG_COVER_BUCKET = "blog-covers";
const BLOG_COVER_PATH_PATTERN = /^[0-9a-f-]{36}\/[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f-]{36}\.webp$/i;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(120, Math.max(1, Math.ceil(words / 200)));
}

function dateToTimestamp(date: string): string | null {
  return date ? new Date(`${date}T00:00:00.000Z`).toISOString() : null;
}

function isConfiguredStorageUrl(value: string): boolean {
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const expected = new URL(config.url);
    const actual = new URL(value);
    return actual.origin === expected.origin && actual.pathname.includes("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

async function resolveBlogCoverUrl(
  db: Awaited<ReturnType<typeof requireAdminAction>>["db"],
  path: string,
  adminId: string,
  previousPath: string | null,
): Promise<{ url: string | null; error: string | null }> {
  if (!path) return { url: null, error: null };
  if (!BLOG_COVER_PATH_PATTERN.test(path)) {
    return { url: null, error: "Path cover tidak valid. Unggah ulang cover dari form." };
  }
  if (path !== previousPath && !path.startsWith(`${adminId}/`)) {
    return { url: null, error: "Cover baru harus diunggah melalui sesi admin ini." };
  }
  const [folder, fileName] = path.split("/");
  const { data: files, error: listError } = await db.storage
    .from(BLOG_COVER_BUCKET)
    .list(folder, { limit: 100, search: fileName });
  const asset = files?.find((file) => file.name === fileName);
  const metadata = (asset?.metadata ?? {}) as Record<string, unknown>;
  const fileSize = Number(metadata.size);
  if (listError || !asset || metadata.mimetype !== "image/webp" || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > 5 * 1024 * 1024) {
    return { url: null, error: "Cover tidak ditemukan di bucket blog-covers atau format/ukurannya tidak valid." };
  }
  const url = db.storage.from(BLOG_COVER_BUCKET).getPublicUrl(path).data.publicUrl;
  if (!isConfiguredStorageUrl(url)) {
    return { url: null, error: "URL cover bukan berasal dari Supabase Storage yang dikonfigurasi." };
  }
  return { url, error: null };
}

async function removeBlogCover(
  db: Awaited<ReturnType<typeof requireAdminAction>>["db"],
  path: string | null,
) {
  if (!path) return;
  const { error } = await db.storage.from(BLOG_COVER_BUCKET).remove([path]);
  if (error) console.error("[admin] blog cover cleanup failed", error.message);
}

function buildPostValues(
  input: BlogPostInput,
  adminId: string,
  coverUrl: string | null,
  existingPublishedAt?: string | null,
) {
  const publishedAt = input.publishedDate
    ? dateToTimestamp(input.publishedDate)
    : input.status === "published"
      ? existingPublishedAt ?? new Date().toISOString()
      : null;

  return {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    content_md: input.contentMd,
    category_id: input.categoryId,
    author_name: input.authorName,
    cover_image: coverUrl,
    cover_image_path: input.coverImagePath || null,
    cover_image_alt: input.coverImagePath ? input.coverImageAlt : null,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
    related_course_id: input.relatedCourseId || null,
    status: input.status,
    published_at: publishedAt,
    reading_minutes: readingMinutes(input.contentMd),
    updated_by: adminId,
  };
}

async function validateReferences(
  db: Awaited<ReturnType<typeof requireAdminAction>>["db"],
  input: BlogPostInput,
): Promise<string | null> {
  const { data: category, error: categoryError } = await db
    .from("blog_categories")
    .select("id")
    .eq("id", input.categoryId)
    .maybeSingle();
  if (categoryError || !category) return "Kategori tidak ditemukan. Muat ulang lalu pilih kategori yang tersedia.";

  if (input.relatedCourseId) {
    const { data: course, error: courseError } = await db
      .from("courses")
      .select("id")
      .eq("id", input.relatedCourseId)
      .eq("status", "published")
      .maybeSingle();
    if (courseError || !course) return "Kursus terkait tidak ditemukan atau belum dipublikasikan.";
  }
  return null;
}

function revalidateBlogSurfaces(slugs: string[] = []) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/blog/${slug}`);
  }
}

export async function createBlogPostAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const parsed = parseBlogPostForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data artikel.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }
    if (parsed.data.status === "published") {
      const [blocker] = blogPublishBlockers(parsed.data);
      if (blocker) return { status: "error", message: blocker };
    }

    const referenceError = await validateReferences(context.db, parsed.data);
    if (referenceError) return { status: "error", message: referenceError };
    const cover = await resolveBlogCoverUrl(context.db, parsed.data.coverImagePath, context.user.id, null);
    if (cover.error) return { status: "error", message: cover.error };

    const values = buildPostValues(parsed.data, context.user.id, cover.url);
    const { data, error } = await context.db
      .from("blog_posts")
      .insert({ ...values, created_by: context.user.id })
      .select("id, slug, category_id, status")
      .single();
    if (error || !data) {
      console.error("[admin] blog post insert failed", error?.code, error?.message);
      return adminErrorState(error);
    }

    await recordAdminAudit(context, {
      action: "blog_post.created",
      targetType: "blog_post",
      targetId: data.id as string,
      metadata: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        status: parsed.data.status,
        categoryId: data.category_id as string,
      },
    });
    revalidateBlogSurfaces([parsed.data.slug]);
    redirect(`/admin/blog/${data.id}?created=1`);
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

export async function updateBlogPostAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const postId = requiredString(formData, "postId");
    if (!UUID_PATTERN.test(postId)) return { status: "error", message: "Artikel tidak valid." };

    const parsed = parseBlogPostForm(formData);
    if (!parsed.success) {
      return {
        status: "error",
        message: "Periksa kembali data artikel.",
        fieldErrors: zodFieldErrors(parsed.error),
      };
    }
    if (parsed.data.status === "published") {
      const [blocker] = blogPublishBlockers(parsed.data);
      if (blocker) return { status: "error", message: blocker };
    }

    const { data: existing, error: existingError } = await context.db
      .from("blog_posts")
      .select("id, slug, status, published_at, category_id, cover_image_path")
      .eq("id", postId)
      .maybeSingle();
    if (existingError || !existing) return { status: "error", message: "Artikel tidak ditemukan." };

    const referenceError = await validateReferences(context.db, parsed.data);
    if (referenceError) return { status: "error", message: referenceError };
    const oldCoverPath = typeof existing.cover_image_path === "string" ? existing.cover_image_path : null;
    const cover = await resolveBlogCoverUrl(context.db, parsed.data.coverImagePath, context.user.id, oldCoverPath);
    if (cover.error) return { status: "error", message: cover.error };

    const values = buildPostValues(parsed.data, context.user.id, cover.url, existing.published_at as string | null);
    const { error } = await context.db
      .from("blog_posts")
      .update(values)
      .eq("id", postId);
    if (error) {
      console.error("[admin] blog post update failed", error.code, error.message);
      return adminErrorState(error);
    }
    if (oldCoverPath && oldCoverPath !== parsed.data.coverImagePath) {
      await removeBlogCover(context.db, oldCoverPath);
    }

    const statusChanged = existing.status !== parsed.data.status;
    await recordAdminAudit(context, {
      action: statusChanged ? "blog_post.status_changed" : "blog_post.updated",
      targetType: "blog_post",
      targetId: postId,
      metadata: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        status: parsed.data.status,
        ...(statusChanged ? { from: existing.status, to: parsed.data.status } : {}),
      },
    });
    revalidateBlogSurfaces([existing.slug as string, parsed.data.slug]);
    return { status: "success", message: "Artikel diperbarui." };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function setBlogPostStatusAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id);
    if (limited) return limited;

    const postId = requiredString(formData, "postId");
    const rawStatus = requiredString(formData, "status");
    if (!UUID_PATTERN.test(postId)) return { status: "error", message: "Artikel tidak valid." };
    if (rawStatus !== "draft" && rawStatus !== "published" && rawStatus !== "archived") {
      return { status: "error", message: "Status artikel tidak valid." };
    }
    const status = rawStatus as BlogPostStatus;

    const { data: post, error: postError } = await context.db
      .from("blog_posts")
      .select("id, title, slug, status, excerpt, content_md, category_id, author_name, cover_image_path, cover_image_alt, seo_title, seo_description, related_course_id, published_at")
      .eq("id", postId)
      .maybeSingle();
    if (postError || !post) return { status: "error", message: "Artikel tidak ditemukan." };

    let validatedCoverUrl: string | null = null;
    if (status === "published") {
      const publishedDate = post.published_at
        ? new Date(post.published_at as string).toISOString().slice(0, 10)
        : "";
      const parsed = blogPostInputSchema.safeParse({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentMd: post.content_md,
        categoryId: post.category_id,
        authorName: post.author_name ?? "LearnCode",
        coverImagePath: typeof post.cover_image_path === "string" ? post.cover_image_path : "",
        coverImageAlt: post.cover_image_alt ?? "",
        seoTitle: post.seo_title ?? "",
        seoDescription: post.seo_description ?? "",
        publishedDate,
        relatedCourseId: post.related_course_id ?? "",
        status,
      });
      if (!parsed.success) {
        return { status: "error", message: "Lengkapi data artikel di formulir sebelum menerbitkannya." };
      }
      const [blocker] = blogPublishBlockers(parsed.data);
      if (blocker) return { status: "error", message: blocker };
      const referenceError = await validateReferences(context.db, parsed.data);
      if (referenceError) return { status: "error", message: referenceError };
      const cover = await resolveBlogCoverUrl(
        context.db,
        parsed.data.coverImagePath,
        context.user.id,
        parsed.data.coverImagePath,
      );
      if (cover.error) return { status: "error", message: cover.error };
      validatedCoverUrl = cover.url;
    }

    const publishedAt = post.published_at ?? (status === "published" ? new Date().toISOString() : null);
    const { error } = await context.db
      .from("blog_posts")
      .update({
        status,
        published_at: publishedAt,
        updated_by: context.user.id,
        ...(status === "published" ? { cover_image: validatedCoverUrl } : {}),
      })
      .eq("id", postId);
    if (error) return adminErrorState(error);

    await recordAdminAudit(context, {
      action: "blog_post.status_changed",
      targetType: "blog_post",
      targetId: postId,
      metadata: { title: post.title as string, slug: post.slug as string, from: post.status as string, to: status },
    });
    revalidateBlogSurfaces([post.slug as string]);
    return {
      status: "success",
      message: status === "published" ? "Artikel diterbitkan." : status === "draft" ? "Artikel dijadikan draft." : "Artikel diarsipkan.",
    };
  } catch (error) {
    return adminErrorState(error);
  }
}

export async function deleteBlogPostAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const context = await requireAdminAction();
    const limited = checkAdminRateLimit(context.user.id, { sensitive: true });
    if (limited) return limited;

    const postId = requiredString(formData, "postId");
    const confirmation = requiredString(formData, "confirmation");
    if (!UUID_PATTERN.test(postId)) return { status: "error", message: "Artikel tidak valid." };

    const { data: post, error: postError } = await context.db
      .from("blog_posts")
      .select("id, title, slug, status, cover_image_path")
      .eq("id", postId)
      .maybeSingle();
    if (postError || !post) return { status: "error", message: "Artikel tidak ditemukan." };
    if (post.status === "published") {
      return { status: "error", message: "Unpublish atau arsipkan artikel sebelum menghapusnya." };
    }
    if (confirmation !== post.slug) {
      return { status: "error", message: "Konfirmasi slug tidak cocok." };
    }

    const { error } = await context.db.from("blog_posts").delete().eq("id", postId);
    if (error) return adminErrorState(error);
    await removeBlogCover(context.db, typeof post.cover_image_path === "string" ? post.cover_image_path : null);

    await recordAdminAudit(context, {
      action: "blog_post.deleted",
      targetType: "blog_post",
      targetId: postId,
      metadata: { title: post.title as string, slug: post.slug as string, status: post.status as string },
    });
    revalidateBlogSurfaces([post.slug as string]);
    redirect("/admin/blog?deleted=1");
  } catch (error) {
    const digest = (error as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw error;
    return adminErrorState(error);
  }
}

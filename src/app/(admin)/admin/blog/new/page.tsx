import type { Metadata } from "next";
import Link from "next/link";

import { BlogPostForm } from "@/components/admin/blog-post-form";
import { EmptyState, PageHeader } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { createBlogPostAction } from "@/lib/actions/admin-blog";
import { requireAdminPage } from "@/lib/admin/auth";
import { listBlogCategories, listPublishedCourseOptions } from "@/lib/admin/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artikel blog baru",
  robots: { index: false, follow: false },
};

export default async function NewBlogPostPage() {
  const { db } = await requireAdminPage("/admin/blog/new");
  const [categories, courses] = await Promise.all([
    listBlogCategories(db),
    listPublishedCourseOptions(db),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Artikel baru"
        description="Tulis materi yang benar-benar membantu. Artikel baru disimpan sebagai draft kecuali status publikasi diubah."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Blog", href: "/admin/blog" },
          { label: "Baru" },
        ]}
      />
      {categories.length === 0 ? (
        <EmptyState
          title="Kategori belum tersedia"
          description="Jalankan migrasi blog untuk membuat kategori dan kebijakan akses sebelum menulis artikel."
          action={<Button asChild size="sm" variant="secondary"><Link href="/admin/blog">Kembali ke blog</Link></Button>}
        />
      ) : (
        <BlogPostForm action={createBlogPostAction} categories={categories} courses={courses} />
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, PlusCircle } from "lucide-react";

import { FilterBar } from "@/components/admin/filter-bar";
import {
  DataTable,
  EmptyState,
  FlashNotice,
  PageHeader,
  Pagination,
  StatusBadge,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { QuickAction } from "@/components/admin/quick-action";
import { Button } from "@/components/ui/button";
import { setBlogPostStatusAction } from "@/lib/actions/admin-blog";
import { isPublicationDateReached } from "@/lib/blog-utils";
import { requireAdminPage } from "@/lib/admin/auth";
import { listAdminBlogPosts, listBlogCategories } from "@/lib/admin/blog";
import { formatDateTime } from "@/lib/utils";
import { blogAdminQuerySchema, BLOG_PAGE_SIZE } from "@/lib/validation/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola blog",
  robots: { index: false, follow: false },
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = blogAdminQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : "",
    status: typeof raw.status === "string" ? raw.status : "all",
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : "",
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const query = parsed.success
    ? parsed.data
    : { q: "", status: "all" as const, categoryId: "", page: 1 };

  const { db } = await requireAdminPage("/admin/blog");
  const [categories, result] = await Promise.all([
    listBlogCategories(db),
    listAdminBlogPosts(db, query),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Blog"
        description="Tulis, tinjau, dan kelola artikel publik. Setiap aksi diperiksa ulang di server dan dicatat di log audit."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Blog" }]}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/blog/new">
              <PlusCircle aria-hidden="true" />
              Artikel baru
            </Link>
          </Button>
        }
      />

      {raw.created === "1" ? <FlashNotice>Artikel dibuat. Tinjau isi dan pratinjau sebelum menerbitkan.</FlashNotice> : null}
      {raw.deleted === "1" ? <FlashNotice>Artikel dihapus permanen.</FlashNotice> : null}

      <FilterBar
        action="/admin/blog"
        query="blog-posts"
        searchValue={query.q}
        placeholder="Cari judul atau slug artikel…"
        resetHref="/admin/blog"
        selects={[
          {
            name: "status",
            label: "Status",
            value: query.status,
            options: [
              { value: "all", label: "Semua status" },
              { value: "draft", label: "Draft" },
              { value: "published", label: "Terbit" },
              { value: "archived", label: "Arsip" },
            ],
          },
          {
            name: "categoryId",
            label: "Kategori",
            value: query.categoryId,
            options: [
              { value: "", label: "Semua kategori" },
              ...categories.map((category) => ({ value: category.id, label: category.name })),
            ],
          },
        ]}
      />

      {result.rows.length === 0 ? (
        <EmptyState
          title="Belum ada artikel yang cocok"
          description="Ubah filter, atau buat artikel baru sebagai draft."
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/blog/new">Buat artikel</Link>
            </Button>
          }
        />
      ) : (
        <DataTable caption="Daftar artikel blog">
          <THead>
            <TR>
              <TH>Artikel</TH>
              <TH>Kategori</TH>
              <TH>Status</TH>
              <TH>Diperbarui</TH>
              <TH>Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {result.rows.map((post) => {
              const publicNow =
                post.status === "published" && isPublicationDateReached(post.published_at);
              return (
                <TR key={post.id}>
                  <TD className="min-w-[16rem]">
                    <Link href={`/admin/blog/${post.id}`} className="font-medium text-ink hover:underline">
                      {post.title}
                    </Link>
                    <p className="mt-0.5 line-clamp-2 max-w-xl text-[11px] leading-relaxed text-muted">{post.excerpt}</p>
                    <p className="mt-1 font-mono text-[9px] text-muted">/blog/{post.slug} · {post.reading_minutes} menit</p>
                  </TD>
                  <TD>{post.category?.name ?? "—"}</TD>
                  <TD><StatusBadge status={post.status} /></TD>
                  <TD className="whitespace-nowrap text-[11px]">{formatDateTime(post.updated_at)}</TD>
                  <TD>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/admin/blog/${post.id}`}>Sunting</Link>
                      </Button>
                      {publicNow ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Buka artikel ${post.title}`}>
                            <ExternalLink aria-hidden="true" />
                            Pratinjau
                          </Link>
                        </Button>
                      ) : null}
                      {post.status === "published" ? (
                        <QuickAction
                          action={setBlogPostStatusAction}
                          fields={{ postId: post.id, status: "draft" }}
                          label="Jadikan draft"
                        />
                      ) : (
                        <QuickAction
                          action={setBlogPostStatusAction}
                          fields={{ postId: post.id, status: "published" }}
                          label="Terbitkan"
                        />
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/blog"
        params={{ q: query.q, status: query.status, categoryId: query.categoryId }}
        page={query.page}
        pageSize={BLOG_PAGE_SIZE}
        total={result.total}
      />
    </div>
  );
}

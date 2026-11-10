import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { FilterBar } from "@/components/admin/filter-bar";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Pagination,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin/auth";
import { listQuizRows } from "@/lib/admin/queries";
import { ADMIN_PAGE_SIZE, adminSearchSchema } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola quiz",
  robots: { index: false, follow: false },
};

export default async function AdminQuizzesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = adminSearchSchema.parse({
    q: typeof raw.q === "string" ? raw.q : "",
    status: "all",
    page: typeof raw.page === "string" ? raw.page : "1",
  });
  const { db } = await requireAdminPage("/admin/quizzes");
  const { rows, total } = await listQuizRows(db, { search: parsed.q, page: parsed.page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quiz"
        description="Setiap kursus punya satu quiz akhir. Kunci jawaban hanya dibaca server; tidak pernah dikirim sebelum peserta mengumpulkan jawaban."
        breadcrumb={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Quiz" }]}
        actions={
          <Button asChild size="sm">
            <Link href="/admin/quizzes/new">
              <PlusCircle aria-hidden="true" />
              Quiz baru
            </Link>
          </Button>
        }
      />

      <FilterBar
        action="/admin/quizzes"
        query="quizzes"
        searchValue={parsed.q}
        placeholder="Cari judul quiz…"
        resetHref="/admin/quizzes"
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada quiz yang cocok"
          description="Buat quiz untuk kursus yang sudah ada, lalu tambahkan pertanyaan dan kunci jawabannya."
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/admin/quizzes/new">Buat quiz</Link>
            </Button>
          }
        />
      ) : (
        <DataTable caption="Daftar quiz">
          <THead>
            <TR>
              <TH>Quiz</TH>
              <TH>Kursus</TH>
              <TH>Soal</TH>
              <TH>Nilai lulus</TH>
              <TH>Percobaan</TH>
              <TH>Wajib</TH>
              <TH>Aksi</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((quiz) => (
              <TR key={quiz.id}>
                <TD>
                  <Link href={`/admin/quizzes/${quiz.id}`} className="font-medium text-ink hover:underline">
                    {quiz.title}
                  </Link>
                </TD>
                <TD className="max-w-[14rem] truncate">{quiz.course_title}</TD>
                <TD className="font-mono">{quiz.question_count}</TD>
                <TD className="font-mono">{quiz.passing_score}%</TD>
                <TD className="font-mono">{quiz.attempts}</TD>
                <TD>{quiz.required ? "Ya" : <span className="text-muted">Tidak</span>}</TD>
                <TD>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/quizzes/${quiz.id}`}>Kelola</Link>
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </DataTable>
      )}

      <Pagination
        basePath="/admin/quizzes"
        params={{ q: parsed.q }}
        page={parsed.page}
        pageSize={ADMIN_PAGE_SIZE}
        total={total}
      />
    </div>
  );
}

import type { Metadata } from "next";

import { CourseForm } from "@/components/admin/course-form";
import { PageHeader } from "@/components/admin/primitives";
import { createCourseAction } from "@/lib/actions/admin-courses";
import { requireAdminPage } from "@/lib/admin/auth";
import { getPlatformSettings } from "@/lib/platform";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kursus baru",
  robots: { index: false, follow: false },
};

export default async function NewCoursePage() {
  await requireAdminPage("/admin/courses/new");
  const platform = await getPlatformSettings();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kursus baru"
        description="Isi identitas dan aturan kelulusan. Setelah tersimpan sebagai draft, tambahkan lesson lalu publikasikan."
        breadcrumb={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Kursus", href: "/admin/courses" },
          { label: "Baru" },
        ]}
      />
      <CourseForm action={createCourseAction} defaultPassingScore={platform.defaultPassingScore} />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminAuthState } from "@/lib/admin/auth";
import { displayName } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin shell. The real authorization gate lives in every page and action;
 * this layout only keeps unauthenticated visitors out before rendering chrome.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const state = await getAdminAuthState();
  if (state.status === "unauthenticated") redirect("/admin");
  if (state.status === "forbidden") redirect("/admin?denied=1");
  if (state.status === "unavailable") redirect("/admin?status=unavailable");

  const { user, profile } = state.context;

  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <AdminNav
        adminName={displayName(user, profile)}
        adminEmail={user.email ?? "admin"}
      />
      <main id="main-content" className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[72rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

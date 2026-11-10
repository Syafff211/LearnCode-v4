"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Award,
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Megaphone,
  Newspaper,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Umum",
    items: [{ href: "/admin/dashboard", label: "Ringkasan", icon: LayoutDashboard }],
  },
  {
    label: "Kurikulum",
    items: [
      { href: "/admin/courses", label: "Kursus", icon: BookOpen },
      { href: "/admin/lessons", label: "Lesson", icon: FileText },
      { href: "/admin/quizzes", label: "Quiz", icon: ListChecks },
    ],
  },
  {
    label: "Publikasi",
    items: [
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/popups", label: "Popup promosi", icon: Megaphone },
    ],
  },
  {
    label: "Peserta",
    items: [
      { href: "/admin/users", label: "Pengguna", icon: Users },
      { href: "/admin/certificates", label: "Sertifikat", icon: Award },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/ai-settings", label: "Pengaturan AI", icon: Sparkles },
      { href: "/admin/settings", label: "Pengaturan", icon: Settings },
      { href: "/admin/audit-logs", label: "Log audit", icon: ScrollText },
    ],
  },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Navigasi admin">
      <ul className="space-y-4">
        {navGroups.map((group) => (
          <li key={group.label}>
            <p className="mb-1 px-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-[0.8125rem] transition-colors motion-reduce:transition-none",
                        active
                          ? "bg-accent-soft font-medium text-accent-text"
                          : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminNav({
  adminName,
  adminEmail,
}: {
  adminName: string;
  adminEmail: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-canvas/95 px-4 backdrop-blur-[2px] lg:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span className="font-display text-base font-semibold text-ink">LearnCode</span>
          <span className="rounded-[3px] border border-line-strong px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            Admin
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label="Buka navigasi admin"
          aria-expanded={open}
        >
          <Menu aria-hidden="true" />
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#14130f]/45"
            aria-label="Tutup navigasi"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[17.5rem] max-w-[85vw] flex-col border-r border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogoMark className="size-6" />
                <span className="font-display text-base font-semibold text-ink">Admin</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Tutup navigasi"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-5 flex-1 overflow-y-auto">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-line pt-3 text-xs text-muted">
              <p className="truncate font-medium text-ink">{adminName}</p>
              <p className="truncate">{adminEmail}</p>
              <div className="mt-2 flex items-center gap-3">
                <Link href="/dashboard" className="text-accent-text hover:underline" onClick={() => setOpen(false)}>
                  Lihat situs
                </Link>
                <form action={signOutAction}>
                  <button type="submit" className="inline-flex items-center gap-1 text-ink-soft hover:text-ink">
                    <LogOut className="size-3.5" aria-hidden="true" />
                    Keluar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface/60 lg:flex">
        <div className="px-4 pb-4 pt-5">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
          >
            <LogoMark className="size-6" />
            <span className="font-display text-[1.1rem] font-semibold leading-none tracking-[-0.02em] text-ink">
              LearnCode
            </span>
          </Link>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
            Panel admin
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <NavLinks pathname={pathname} />
        </div>

        <div className="border-t border-line px-4 py-3">
          <p className="truncate text-[0.8125rem] font-medium text-ink">{adminName}</p>
          <p className="truncate text-[11px] text-muted">{adminEmail}</p>
          <div className="mt-2.5 flex items-center gap-3 text-[11px]">
            <Link href="/dashboard" className="text-accent-text hover:underline">
              Lihat situs
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 text-ink-soft transition-colors hover:text-ink"
              >
                <LogOut className="size-3" aria-hidden="true" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

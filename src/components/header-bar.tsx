"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
} from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";
import { cn, initials } from "@/lib/utils";

type HeaderUser = { name: string; email: string } | null;

const marketingLinks = [
  { href: "/courses", label: "Courses" },
  { href: "/blog", label: "Blog" },
  { href: "/playground", label: "Playground" },
  { href: "/ai-tutor", label: "AI Tutor" },
];

const appLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/blog", label: "Blog" },
  { href: "/playground", label: "Playground" },
  { href: "/ai-tutor", label: "AI Tutor" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/courses") return pathname === "/courses" || pathname.startsWith("/courses/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderBar({
  variant,
  user,
  logoUrl,
}: {
  variant: "marketing" | "app";
  user: HeaderUser;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const links = variant === "app" ? appLinks : marketingLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-[2px]">
      <div className="container-lc">
        <div className="flex h-15 items-center gap-6 py-3.5">
          <Logo href={user ? "/dashboard" : "/"} src={logoUrl} />

          <nav aria-label="Navigasi utama" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {links.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative rounded-[4px] px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors",
                        active ? "text-ink" : "text-muted hover:text-ink",
                      )}
                    >
                      {link.label}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-2.5 -bottom-[13px] h-[2px] bg-accent"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="ml-1 flex items-center gap-2 rounded-[5px] py-1 pl-1 pr-1.5 text-sm text-ink-soft transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                    aria-label={`Menu akun ${user.name}`}
                  >
                    <span className="flex size-7 items-center justify-center rounded-full border border-line-strong bg-surface-2 font-mono text-[11px] font-medium text-ink">
                      {initials(user.name)}
                    </span>
                    <ChevronDown className="size-3.5 text-muted" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <span className="block truncate font-medium text-ink">{user.name}</span>
                    <span className="block truncate text-xs text-muted">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard aria-hidden="true" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/certificates">
                      <Award aria-hidden="true" />
                      Sertifikat
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <Settings aria-hidden="true" />
                      Pengaturan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOutAction}>
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full">
                        <LogOut aria-hidden="true" />
                        Keluar
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden items-center gap-1 md:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="ml-1">
                  <Link href="/register">Mulai Belajar</Link>
                </Button>
              </div>
            )}

            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-[5px] text-ink-soft transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text md:hidden"
                  aria-label="Buka menu navigasi"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </button>
              </DialogTrigger>
              <DialogContent
                className="left-auto right-0 top-0 h-dvh w-[min(20rem,90vw)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none border-y-0 border-r-0 border-l p-0"
                hideClose
              >
                <DialogTitle className="sr-only">Menu navigasi</DialogTitle>
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
                    <Logo href={user ? "/dashboard" : "/"} src={logoUrl} />
                    <DialogClose
                      className="rounded-[4px] p-1.5 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
                      aria-label="Tutup menu"
                    >
                      <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                        <path
                          d="M4 4l8 8M12 4l-8 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </DialogClose>
                  </div>

                  <nav aria-label="Navigasi seluler" className="flex-1 px-2 py-3">
                    <ul>
                      {links.map((link) => (
                        <li key={link.href}>
                          <DialogClose asChild>
                            <Link
                              href={link.href}
                              className={cn(
                                "flex items-center justify-between rounded-[4px] px-3 py-2.5 text-[0.9375rem] transition-colors hover:bg-surface-2",
                                isActive(pathname, link.href)
                                  ? "font-medium text-ink"
                                  : "text-ink-soft",
                              )}
                            >
                              {link.label}
                            </Link>
                          </DialogClose>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div className="space-y-2 border-t border-line px-4 py-4">
                    {user ? (
                      <>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-ink">{user.name}</p>
                          <p className="truncate text-xs text-muted">{user.email}</p>
                        </div>
                        <Button asChild variant="secondary" className="w-full justify-start">
                          <Link href="/settings">
                            <Settings aria-hidden="true" />
                            Pengaturan akun
                          </Link>
                        </Button>
                        <form action={signOutAction}>
                          <Button type="submit" variant="ghost" className="w-full justify-start">
                            <LogOut aria-hidden="true" />
                            Keluar
                          </Button>
                        </form>
                      </>
                    ) : (
                      <>
                        <Button asChild className="w-full">
                          <Link href="/register">Mulai Belajar</Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full">
                          <Link href="/login">Login</Link>
                        </Button>
                      </>
                    )}
                    <p className="flex items-center gap-1.5 pt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
                      <Sparkles className="size-3" aria-hidden="true" />
                      Learn by doing
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-line pb-5">
      {breadcrumb && breadcrumb.length > 0 ? (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted">
          {breadcrumb.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-3" aria-hidden="true" /> : null}
              {item.href ? (
                <Link href={item.href} className="hover:text-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function DataTable({
  children,
  className,
  caption,
}: {
  children: ReactNode;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-[8px] border border-line bg-surface", className)}>
      <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-line bg-surface-2/60">{children}</thead>;
}

export function TH({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("align-middle transition-colors hover:bg-surface-2/40", className)}>{children}</tr>;
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-3 text-[0.8125rem] text-ink-soft", className)}>{children}</td>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[8px] border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-2">
        <Inbox className="size-4 text-muted" aria-hidden="true" />
      </span>
      <p className="mt-1 text-sm font-medium text-ink">{title}</p>
      <p className="max-w-md text-[0.8125rem] leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "neutral" | "accent" | "success" | "warning" | "danger" | "outline" }> = {
    draft: { label: "Draft", variant: "neutral" },
    published: { label: "Terbit", variant: "success" },
    archived: { label: "Arsip", variant: "warning" },
    valid: { label: "Berlaku", variant: "success" },
    revoked: { label: "Dicabut", variant: "danger" },
    active: { label: "Aktif", variant: "success" },
    inactive: { label: "Nonaktif", variant: "neutral" },
    scheduled: { label: "Terjadwal", variant: "warning" },
    expired: { label: "Berakhir", variant: "neutral" },
    primary: { label: "Utama", variant: "accent" },
    suspended: { label: "Nonaktif", variant: "danger" },
    admin: { label: "Admin", variant: "accent" },
    user: { label: "Pengguna", variant: "neutral" },
  };
  const entry = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const buildHref = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && value !== "all") query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="font-mono text-[11px] text-muted">
        {from}–{to} dari {total}
      </p>
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-[5px] border border-line-strong bg-surface px-2.5 text-[0.8125rem] text-ink-soft hover:bg-surface-2"
            rel="prev"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Sebelumnya
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-[5px] border border-line px-2.5 text-[0.8125rem] text-muted/60">
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Sebelumnya
          </span>
        )}
        <span className="px-1 font-mono text-[11px] text-muted">
          {page}/{totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-[5px] border border-line-strong bg-surface px-2.5 text-[0.8125rem] text-ink-soft hover:bg-surface-2"
            rel="next"
          >
            Berikutnya
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-[5px] border border-line px-2.5 text-[0.8125rem] text-muted/60">
            Berikutnya
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </span>
        )}
      </div>
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[0.8125rem] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted">{hint}</p> : null}
      {error && error.length > 0 ? (
        <p className="text-[11px] text-danger" role="alert">
          {error.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message?: string;
}) {
  if (!message || status === "idle") return null;
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[6px] border px-3 py-2.5 text-[0.8125rem] leading-relaxed",
        status === "error"
          ? "border-danger/30 bg-danger-soft text-ink-soft"
          : "border-ok/25 bg-ok-soft text-ink-soft",
      )}
    >
      {message}
    </div>
  );
}

export function FlashNotice({
  tone = "success",
  children,
}: {
  tone?: "success" | "warning" | "error";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[6px] border px-3 py-2.5 text-[0.8125rem] leading-relaxed",
        tone === "success" && "border-ok/25 bg-ok-soft text-ink-soft",
        tone === "warning" && "border-highlight/25 bg-highlight-soft text-ink-soft",
        tone === "error" && "border-danger/30 bg-danger-soft text-ink-soft",
      )}
    >
      {children}
    </div>
  );
}

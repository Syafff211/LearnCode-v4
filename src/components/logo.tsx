import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("size-7", className)}
    >
      <rect x="1" y="1" width="26" height="26" rx="5" className="fill-accent" />
      <path
        d="M9.5 9 5.5 14l4 5"
        stroke="var(--lc-accent-ink)"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 19.5h7.5"
        stroke="var(--lc-accent-ink)"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  showWordmark = true,
  src,
}: {
  href?: string;
  className?: string;
  showWordmark?: boolean;
  src?: string | null;
}) {
  return (
    <Link
      href={href}
      aria-label="LearnCode — beranda"
      className={cn(
        "inline-flex items-center gap-2 rounded-[4px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className,
      )}
    >
      {src ? (
        // Admin-provided logo URL; rendered as-is so it works on any deployment.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Logo platform" className="size-7 rounded-[4px] object-contain" />
      ) : (
        <LogoMark />
      )}
      {showWordmark ? (
        <span className="font-display text-[1.35rem] font-semibold leading-none tracking-[-0.02em]">
          LearnCode
        </span>
      ) : null}
    </Link>
  );
}

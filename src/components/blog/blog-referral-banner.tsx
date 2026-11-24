"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/components/loading-screen";
import {
  HILLTOPADS_REFERRAL_BANNERS,
  HILLTOPADS_REFERRAL_URL,
  HILLTOPADS_REFERRER_POLICY,
  isBlogAdsRoute,
} from "@/lib/blog-ads";
import { cn } from "@/lib/utils";

const ROTATION_INTERVAL_MS = 7000;

export function BlogReferralBanner({ className }: { className?: string }) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedIds, setFailedIds] = useState<Record<string, true>>({});

  const isBlogRoute = isBlogAdsRoute(pathname);
  const visibleBanners = HILLTOPADS_REFERRAL_BANNERS.filter(
    (banner) => !failedIds[banner.id],
  );
  const visibleCount = visibleBanners.length;
  const activeBanner =
    visibleCount > 0 ? visibleBanners[activeIndex % visibleCount] : null;

  useEffect(() => {
    if (!isBlogRoute || paused || reducedMotion || visibleCount <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleCount);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isBlogRoute, paused, reducedMotion, visibleCount]);

  if (!isBlogRoute) return null;

  return (
    <aside
      aria-label="Partner HilltopAds"
      data-hilltopads-referral-slot="728x90"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      className={cn("mx-auto w-full max-w-[728px]", className)}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          Partner · HilltopAds
        </span>
        {visibleCount > 1 && activeBanner ? (
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Pilih banner partner"
          >
            {HILLTOPADS_REFERRAL_BANNERS.map((banner, index) => {
              if (failedIds[banner.id]) return null;
              const visibleIdx = visibleBanners.findIndex(
                (item) => item.id === banner.id,
              );
              const isSelected = activeBanner.id === banner.id;

              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() =>
                    setActiveIndex(visibleIdx >= 0 ? visibleIdx : 0)
                  }
                  aria-label={`Banner ${index + 1}: ${banner.label}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 font-mono text-[10px] transition-colors",
                    isSelected
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {activeBanner ? (
        <a
          href={HILLTOPADS_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          referrerPolicy={HILLTOPADS_REFERRER_POLICY}
          className="block overflow-hidden rounded-[6px] border border-line bg-surface-2 transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeBanner.src}
            alt={activeBanner.alt}
            width={activeBanner.width}
            height={activeBanner.height}
            loading="eager"
            decoding="async"
            referrerPolicy={HILLTOPADS_REFERRER_POLICY}
            onError={() => {
              setFailedIds((prev) =>
                prev[activeBanner.id]
                  ? prev
                  : { ...prev, [activeBanner.id]: true },
              );
            }}
            className="block aspect-[728/90] h-auto w-full object-contain"
          />
        </a>
      ) : (
        <a
          href={HILLTOPADS_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          referrerPolicy={HILLTOPADS_REFERRER_POLICY}
          className="flex min-h-[56px] items-center justify-between gap-3 rounded-[6px] border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-line-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
        >
          <span className="text-ink-soft">
            <strong className="font-semibold text-ink">HilltopAds</strong> — Monetisasi trafik situs web dengan eCPM tinggi.
          </span>
          <span className="shrink-0 font-mono text-xs font-medium text-accent-text">
            Kunjungi →
          </span>
        </a>
      )}
    </aside>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  HILLTOPADS_SIDE_BANNERS,
  HILLTOPADS_SIDE_RAIL_MEDIA_QUERY,
  type HilltopAdsSidePosition,
  cleanupHilltopAdsOnRouteExit,
  createHilltopAdsScript,
  isBlogAdsRoute,
  markHilltopAdsExecuted,
} from "@/lib/blog-ads";

function subscribeDesktopRail(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(HILLTOPADS_SIDE_RAIL_MEDIA_QUERY);
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  }
  media.addListener(onStoreChange);
  return () => media.removeListener(onStoreChange);
}

function getDesktopRailSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(HILLTOPADS_SIDE_RAIL_MEDIA_QUERY).matches;
}

function getServerDesktopRailSnapshot(): boolean {
  return false;
}

export function BlogSideAd({ side }: { side: HilltopAdsSidePosition }) {
  const pathname = usePathname();
  const slotRef = useRef<HTMLDivElement | null>(null);
  const isDesktopRail = useSyncExternalStore(
    subscribeDesktopRail,
    getDesktopRailSnapshot,
    getServerDesktopRailSnapshot,
  );
  const config = HILLTOPADS_SIDE_BANNERS[side];
  const isBlogRoute = isBlogAdsRoute(pathname);

  useEffect(() => {
    if (!isBlogRoute || !isDesktopRail) return;

    const slot = slotRef.current;
    if (!slot) return;

    const selector = `script[data-hilltopads-zone="${config.zoneId}"]`;
    if (!document.querySelector(selector)) {
      const script = createHilltopAdsScript(document, {}, config);
      script.addEventListener(
        "load",
        () => {
          if (isBlogAdsRoute(window.location.pathname)) {
            markHilltopAdsExecuted();
          }
        },
        { once: true },
      );
      slot.appendChild(script);
    }

    return () => {
      if (!isBlogAdsRoute(window.location.pathname)) {
        cleanupHilltopAdsOnRouteExit();
        return;
      }

      if (!window.matchMedia(HILLTOPADS_SIDE_RAIL_MEDIA_QUERY).matches) {
        slot.replaceChildren();
      }
    };
  }, [isBlogRoute, isDesktopRail, config]);

  if (!isBlogRoute) return null;

  return (
    <aside
      aria-label={side === "left" ? "Iklan sisi kiri" : "Iklan sisi kanan"}
      data-hilltopads-side-slot={side}
      data-hilltopads-zone={config.zoneId}
      className="hidden w-[300px] shrink-0 xl:sticky xl:top-20 xl:mt-10 xl:block"
    >
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        Iklan
      </p>
      <div
        ref={slotRef}
        className="min-h-[250px] w-[300px] overflow-hidden rounded-[8px] border border-line bg-surface"
      />
    </aside>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  HILLTOPADS_BLOG_ZONES,
  HILLTOPADS_BLOG_ZONE_ID,
  createHilltopAdsScript,
  isBlogAdsRoute,
} from "@/lib/blog-ads";

type HilltopAdsWindow = Window & {
  __lcHilltopAdsExecuted?: boolean;
};

export function BlogAds() {
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isBlogAdsRoute(pathname)) return;

    const host = hostRef.current ?? document.body;
    if (!host) return;

    for (const zone of HILLTOPADS_BLOG_ZONES) {
      const selector = `script[data-hilltopads-zone="${zone.zoneId}"]`;
      if (document.querySelector(selector)) continue;

      const script = createHilltopAdsScript(document, {}, zone);
      script.addEventListener(
        "load",
        () => {
          if (isBlogAdsRoute(window.location.pathname)) {
            (window as HilltopAdsWindow).__lcHilltopAdsExecuted = true;
          }
        },
        { once: true },
      );
      host.appendChild(script);
    }

    return () => {
      if (isBlogAdsRoute(window.location.pathname)) return;

      document
        .querySelectorAll("script[data-hilltopads-zone]")
        .forEach((node) => node.remove());

      const win = window as HilltopAdsWindow;
      if (win.__lcHilltopAdsExecuted) {
        win.__lcHilltopAdsExecuted = false;
        try {
          // HilltopAds MultiTag/Popunder scripts register global listeners/DOM outside this
          // component; reload once on leaving /blog so non-blog routes stay completely clean.
          window.location.replace(window.location.href);
        } catch {
          // Ignore navigation errors in synthetic test environments.
        }
      }
    };
  }, [pathname]);

  if (!isBlogAdsRoute(pathname)) return null;

  return (
    <div
      ref={hostRef}
      data-hilltopads-host={HILLTOPADS_BLOG_ZONE_ID}
      data-hilltopads-zones={HILLTOPADS_BLOG_ZONES.map(
        (zone) => zone.zoneId,
      ).join(",")}
    />
  );
}

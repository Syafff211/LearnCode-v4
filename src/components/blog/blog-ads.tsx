"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  HILLTOPADS_BLOG_ZONES,
  HILLTOPADS_BLOG_ZONE_ID,
  cleanupHilltopAdsOnRouteExit,
  createHilltopAdsScript,
  isBlogAdsRoute,
  markHilltopAdsExecuted,
} from "@/lib/blog-ads";

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
            markHilltopAdsExecuted();
          }
        },
        { once: true },
      );
      host.appendChild(script);
    }

    return () => {
      if (isBlogAdsRoute(window.location.pathname)) return;
      cleanupHilltopAdsOnRouteExit();
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

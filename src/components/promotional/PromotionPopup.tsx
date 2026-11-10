"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PromotionPopupView } from "@/components/promotional/PromotionPopupView";
import {
  isPromotionPopupExcluded,
  type PromotionPopupPublic,
} from "@/lib/promotional-popup";

type PromotionResponse = {
  popup: PromotionPopupPublic | null;
  alreadyViewed?: boolean;
  authenticated?: boolean;
};

type ResolvedPopup = { path: string; popup: PromotionPopupPublic } | null;

function localDayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setStoredValue(key: string, value: string, session = false) {
  try {
    (session ? window.sessionStorage : window.localStorage).setItem(key, value);
  } catch {
    // Storage may be disabled by the browser. In that case the popup remains usable.
  }
}

function hasLocalFrequencyBeenUsed(popup: PromotionPopupPublic): boolean {
  const key = `learncode:promotion:${popup.id}:${popup.frequency}`;
  try {
    if (popup.frequency === "once_per_session") return window.sessionStorage.getItem(key) === "seen";
    if (popup.frequency === "once_per_day") return window.localStorage.getItem(key) === localDayKey();
    if (popup.frequency === "once_per_user") return window.sessionStorage.getItem(`${key}:fallback`) === "seen";
  } catch {
    return false;
  }
  return false;
}

function markLocalFrequencyUsed(popup: PromotionPopupPublic) {
  const key = `learncode:promotion:${popup.id}:${popup.frequency}`;
  if (popup.frequency === "once_per_session") setStoredValue(key, "seen", true);
  if (popup.frequency === "once_per_day") setStoredValue(key, localDayKey());
}

export function PromotionPopup() {
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);
  const [resolvedPopup, setResolvedPopup] = useState<ResolvedPopup>(null);

  useEffect(() => {
    const pagePath = pathname;
    if (!pagePath || isPromotionPopupExcluded(pagePath)) {
      const clearTimer = window.setTimeout(() => setResolvedPopup(null), 0);
      return () => window.clearTimeout(clearTimer);
    }

    const controller = new AbortController();
    const clearTimer = window.setTimeout(() => {
      setResolvedPopup((current) => current?.path === pagePath ? null : current);
    }, 0);

    async function loadPopup() {
      try {
        const response = await fetch(`/api/promotional-popups?path=${encodeURIComponent(pagePath)}`, {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const result = (await response.json()) as PromotionResponse;
        const candidate = result.popup;
        if (!candidate || controller.signal.aborted) return;

        // A hard-reload promotion is eligible only on the first path rendered
        // by this document. Ordinary App Router navigation never counts as reload.
        if (candidate.frequency === "every_reload" && pagePath !== initialPathRef.current) return;
        if (hasLocalFrequencyBeenUsed(candidate)) return;
        if (candidate.frequency === "once_per_user" && (!result.authenticated || result.alreadyViewed)) return;

        if (candidate.frequency === "once_per_user") {
          try {
            const impression = await fetch("/api/promotional-popups/impression", {
              method: "POST",
              cache: "no-store",
              credentials: "same-origin",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ popupId: candidate.id }),
            });
            if (!impression.ok) setStoredValue(`learncode:promotion:${candidate.id}:once_per_user:fallback`, "seen", true);
          } catch {
            setStoredValue(`learncode:promotion:${candidate.id}:once_per_user:fallback`, "seen", true);
          }
        } else {
          markLocalFrequencyUsed(candidate);
        }
        if (!controller.signal.aborted) setResolvedPopup({ path: pagePath, popup: candidate });
      } catch {
        // A missing/unavailable Supabase project should not block page rendering.
      }
    }

    // Keep campaign lookup off the render/LCP path and let the page settle first.
    const timer = window.setTimeout(() => void loadPopup(), 80);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
      controller.abort();
    };
  }, [pathname]);

  const popup = pathname && !isPromotionPopupExcluded(pathname) && resolvedPopup?.path === pathname
    ? resolvedPopup.popup
    : null;
  if (!popup) return null;
  return <PromotionPopupView popup={popup} onClose={() => setResolvedPopup(null)} />;
}

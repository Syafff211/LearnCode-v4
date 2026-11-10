import { describe, expect, it } from "vitest";

import { isPromotionPopupExcluded } from "@/lib/promotional-popup";

describe("isPromotionPopupExcluded", () => {
  it.each([
    "/admin",
    "/admin/dashboard",
    "/admin/popups/new",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/auth/confirm",
    "/verify/LC-EXAMPLE",
    "/certificate-verification/LC-EXAMPLE",
    "/account-suspended",
  ])("excludes %s", (pathname) => {
    expect(isPromotionPopupExcluded(pathname)).toBe(true);
  });

  it.each(["/", "/courses", "/blog", "/blog/html-css", "/playground", "/dashboard", "/certificates/LC-EXAMPLE"]) (
    "keeps %s eligible",
    (pathname) => {
      expect(isPromotionPopupExcluded(pathname)).toBe(false);
    },
  );
});

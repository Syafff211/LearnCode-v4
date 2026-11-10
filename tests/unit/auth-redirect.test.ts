import { afterEach, describe, expect, it, vi } from "vitest";

import { getAuthCallbackUrl } from "@/lib/auth-redirect";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("OAuth callback URL", () => {
  it("uses the canonical app origin and preserves a safe relative destination", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://learncode.example/base-path");

    const callback = new URL(getAuthCallbackUrl("/courses/html?from=login"));
    expect(callback.origin).toBe("https://learncode.example");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe("/courses/html?from=login");
  });

  it.each(["https://attacker.example", "//attacker.example", "\\\\attacker.example"]) (
    "falls back to dashboard for unsafe redirect %j",
    (next) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://learncode.example");
      const callback = new URL(getAuthCallbackUrl(next));
      expect(callback.origin).toBe("https://learncode.example");
      expect(callback.searchParams.get("next")).toBe("/dashboard");
    },
  );
});

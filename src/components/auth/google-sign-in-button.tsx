"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.9 1.3-4.2 2-6.8 2-5.3 0-9.8-3.6-11.4-8.4H5.7v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.7a20 20 0 0 0 0 17.8l6.9-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1.1 7.8 3.2l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.7 15.1l6.9 5.3C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  );
}

function friendlyOAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("provider") &&
    (normalized.includes("not enabled") || normalized.includes("unsupported") || normalized.includes("not found"))
  ) {
    return "Google login belum diaktifkan di Supabase. Hubungi pengelola platform.";
  }
  return "Google login belum bisa dimulai. Coba lagi atau masuk dengan email dan password.";
}

export function GoogleSignInButton({
  redirectTo,
  label = "Lanjutkan dengan Google",
}: {
  redirectTo: string;
  label?: string;
}) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function startGoogleSignIn() {
    if (pending) return;
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Autentikasi belum aktif. Coba lagi setelah Supabase dikonfigurasi.");
      return;
    }

    setPending(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (signInError) {
        setError(friendlyOAuthError(signInError.message));
        setPending(false);
      }
    } catch {
      setError("Google login belum bisa dimulai. Periksa koneksi lalu coba lagi.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">atau</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        loading={pending}
        onClick={() => void startGoogleSignIn()}
      >
        <GoogleMark />
        {pending ? "Mengalihkan ke Google…" : label}
      </Button>
      {error ? (
        <p role="alert" className="rounded-[5px] border border-danger/25 bg-danger-soft px-3 py-2 text-xs text-ink-soft">
          {error}
        </p>
      ) : null}
    </div>
  );
}

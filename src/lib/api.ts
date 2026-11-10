import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getProfile, getSessionContext, type SessionContext } from "@/lib/auth";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store", ...headers } },
  );
}

export function jsonOk<T extends object>(
  data: T,
  init?: { status?: number; headers?: Record<string, string> },
): NextResponse<T> {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": "no-store", ...init?.headers },
  });
}

/** Resolve the server-verified session for an API route, or throw a 401. */
export async function requireApiSession(): Promise<SessionContext> {
  const session = await getSessionContext();
  if (!session) {
    throw new ApiError(
      401,
      "unauthenticated",
      "Sesi kamu tidak valid atau sudah berakhir. Silakan masuk kembali.",
    );
  }
  const profile = await getProfile(session.user.id);
  if (profile?.suspended_at) {
    throw new ApiError(
      403,
      "account_suspended",
      "Akun ini dinonaktifkan oleh administrator. Hubungi admin bila menurutmu ini keliru.",
    );
  }
  return session;
}

export function handleRouteError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ApiError) {
    const body: ApiErrorBody = {
      error: { code: error.code, message: error.message },
    };
    if (error.fieldErrors) body.error.fieldErrors = error.fieldErrors;
    return NextResponse.json(body, {
      status: error.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Data yang dikirim belum valid.",
          fieldErrors,
        },
      },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Never leak internal error details or stack traces to clients.
  console.error("[api] unhandled route error", error instanceof Error ? error.message : error);
  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Terjadi kesalahan pada server. Coba lagi beberapa saat.",
      },
    },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Body request harus berupa JSON yang valid.");
  }
}

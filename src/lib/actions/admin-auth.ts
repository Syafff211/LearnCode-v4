"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { authActionLimiter } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export type AdminLoginState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Admin sign-in.
 *
 * Uses the same Supabase Auth password grant as the normal login, then checks
 * the database role before redirecting. Non-admins are signed out immediately,
 * so a correct password alone never opens the admin area.
 */
export async function adminLoginAction(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Autentikasi belum aktif. Hubungkan project Supabase dan isi environment variables terlebih dahulu.",
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join(".") || "form";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return { status: "error", message: "Periksa kembali email dan password.", fieldErrors };
  }

  const limit = authActionLimiter.check(`admin-login:${parsed.data.email}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    const normalized = error?.message.toLowerCase() ?? "";
    return {
      status: "error",
      message:
        normalized.includes("invalid login credentials")
          ? "Email atau password salah."
          : normalized.includes("email not confirmed")
            ? "Email ini belum diverifikasi. Verifikasi dulu dari inbox."
            : "Masuk belum berhasil. Coba lagi beberapa saat.",
    };
  }

  // Role check happens against the database, not from client input.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, suspended_at")
    .eq("id", data.user.id)
    .maybeSingle();

  const isActiveAdmin = profile?.role === "admin" && !profile.suspended_at;
  if (!isActiveAdmin) {
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    return {
      status: "error",
      message: profile?.suspended_at
        ? "Akun ini dinonaktifkan oleh administrator."
        : "Akun ini terdaftar sebagai pengguna biasa dan tidak punya akses panel admin.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/admin/dashboard");
}

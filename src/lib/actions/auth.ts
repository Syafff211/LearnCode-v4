"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { getAuthCallbackUrl } from "@/lib/auth-redirect";
import { authActionLimiter } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendSignupOtpSchema,
  resetPasswordSchema,
  signupOtpSchema,
} from "@/lib/validation/auth";

export type AuthActionState = {
  status: "idle" | "error" | "success" | "verify-email";
  message?: string;
  email?: string;
  next?: string;
  fieldErrors?: Record<string, string[]>;
};

const SETUP_MESSAGE =
  "Autentikasi belum aktif. Hubungkan project Supabase dan isi environment variables terlebih dahulu.";

function zodFieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

function getSignupRedirectUrl(next: string): string {
  return getAuthCallbackUrl(next);
}

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) {
    return "Email atau password salah. Periksa kembali lalu coba lagi.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email kamu belum diverifikasi. Masukkan kode yang dikirim ke email saat mendaftar. Jika perlu, kembali ke halaman pendaftaran untuk meminta kode baru.";
  }
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Email ini sudah terdaftar. Coba masuk atau gunakan fitur lupa password.";
  }
  if (normalized.includes("password should be") || normalized.includes("weak password")) {
    return "Password terlalu lemah. Gunakan minimal 8 karakter.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.";
  }
  if (normalized.includes("invalid email")) {
    return "Format email tidak valid.";
  }
  return "Permintaan belum berhasil. Coba lagi beberapa saat.";
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase();
  const limit = authActionLimiter.check(`user-sign-in:${email}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: translateAuthError(error?.message ?? "invalid login credentials"),
    };
  }

  // Suspended accounts can authenticate, but must not receive a usable session.
  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.suspended_at) {
    await supabase.auth.signOut();
    redirect("/login?error=suspended");
  }

  revalidatePath("/", "layout");
  redirect(safeRedirectPath(parsed.data.next));
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase();
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/dashboard");
  const limit = authActionLimiter.check(`user-sign-up:${email}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Terlalu banyak percobaan daftar. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const emailRedirectTo = getSignupRedirectUrl(next);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo,
    },
  });

  if (error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("already registered") || normalized.includes("already been registered")) {
      // Allow a person who left the page to request another code without
      // exposing whether a registered address is already confirmed.
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });
      if (!resendError) {
        return {
          status: "verify-email",
          email,
          next,
          message: `Jika akun ${email} belum diverifikasi, kode baru akan dikirim ke email tersebut.`,
        };
      }
    }
    return { status: "error", message: translateAuthError(error.message) };
  }

  // With Supabase "Confirm email" enabled, there is no session until the OTP
  // below is verified. A session here means that email confirmation is disabled.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    status: "verify-email",
    email,
    next,
    message: `Kami mengirim kode verifikasi ke ${email}. Masukkan kode tersebut untuk mengaktifkan akun.`,
  };
}

export async function verifySignUpOtpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = signupOtpSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali email dan kode verifikasi.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase();
  const next = safeRedirectPath(parsed.data.next, "/dashboard");
  const limit = authActionLimiter.check(`signup-verify:${email}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Terlalu banyak percobaan kode. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: parsed.data.token,
    type: "email",
  });

  if (error || !data.user) {
    return {
      status: "error",
      message: "Kode salah atau sudah kedaluwarsa. Periksa email atau minta kode baru.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("suspended_at")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.suspended_at) {
    await supabase.auth.signOut().catch(() => undefined);
    return {
      status: "error",
      message: "Akun ini sedang dinonaktifkan oleh administrator.",
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    status: "success",
    next,
    message: "Email berhasil diverifikasi. Silakan masuk dengan email dan password yang dibuat.",
  };
}

export async function resendSignupOtpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = resendSignupOtpSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Masukkan alamat email yang valid.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase();
  const next = safeRedirectPath(parsed.data.next, "/dashboard");
  const limit = authActionLimiter.check(`signup-resend:${email}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Terlalu banyak permintaan kode. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: getSignupRedirectUrl(next) },
  });

  if (error) {
    const normalized = error.message.toLowerCase();
    if (normalized.includes("rate limit") || normalized.includes("too many")) {
      return {
        status: "error",
        message: "Kode baru saja dikirim. Tunggu sebentar sebelum meminta kode lagi.",
      };
    }
    return {
      status: "error",
      message: "Kode belum dapat dikirim. Coba lagi nanti; jika berlanjut, periksa konfigurasi SMTP Supabase.",
    };
  }

  return {
    status: "success",
    message: `Jika akun ${email} belum diverifikasi, kode baru akan dikirim ke email tersebut.`,
    email,
    next,
  };
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore network errors; clearing the local cookies still signs the user out.
    }
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa email yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAppUrl()}/auth/callback?type=recovery&next=/reset-password`,
  });

  if (error && !error.message.toLowerCase().includes("rate limit")) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  // Always report success to avoid revealing whether an email is registered.
  return {
    status: "success",
    message:
      "Jika email tersebut terdaftar, kami mengirim tautan reset password. Periksa inbox dan folder spam.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: SETUP_MESSAGE };
  }

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      status: "error",
      message:
        "Tautan reset password tidak valid atau sudah kedaluwarsa. Ajukan tautan baru dari halaman lupa password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", message: translateAuthError(error.message) };
  }

  await supabase.auth.signOut({ scope: "others" }).catch(() => undefined);
  return {
    status: "success",
    message: "Password berhasil diperbarui. Kamu akan diarahkan ke dashboard.",
  };
}

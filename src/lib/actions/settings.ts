"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { authActionLimiter } from "@/lib/rate-limit";
import { profileSettingsSchema } from "@/lib/validation/auth";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    map[key] = [...(map[key] ?? []), issue.message];
  }
  return map;
}

export async function updateProfileAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase belum dikonfigurasi, jadi profil belum bisa disimpan.",
    };
  }

  const session = await getSessionContext();
  if (!session) {
    return { status: "error", message: "Sesi kamu berakhir. Silakan masuk lagi." };
  }

  const parsed = profileSettingsSchema.safeParse({
    fullName: formData.get("fullName"),
    preferredLanguage: formData.get("preferredLanguage"),
    theme: formData.get("theme"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const { error } = await session.supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      preferred_language: parsed.data.preferredLanguage,
      theme: parsed.data.theme,
    })
    .eq("id", session.user.id);

  if (error) {
    console.error("[settings] profile update failed", error.message);
    return { status: "error", message: "Profil belum bisa disimpan. Coba lagi." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Profil diperbarui. Nama ini yang dipakai pada sertifikat berikutnya.",
  };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Masukkan password saat ini."),
    newPassword: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(72, "Password maksimal 72 karakter."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "Password baru harus berbeda dari password lama.",
    path: ["newPassword"],
  });

export async function changePasswordAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase belum dikonfigurasi, jadi password belum bisa diubah.",
    };
  }

  const session = await getSessionContext();
  if (!session) {
    return { status: "error", message: "Sesi kamu berakhir. Silakan masuk lagi." };
  }

  const limit = authActionLimiter.check(`password-change:${session.user.id}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: "Terlalu banyak percobaan. Tunggu satu menit lalu coba lagi.",
    };
  }

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali data yang kamu masukkan.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const email = session.user.email;
  if (!email) {
    return { status: "error", message: "Akun ini tidak memiliki email yang bisa diverifikasi." };
  }

  // Verify the current password with Supabase before allowing a change.
  const verify = await session.supabase.auth.signInWithPassword({
    email,
    password: parsed.data.currentPassword,
  });
  if (verify.error) {
    return {
      status: "error",
      message: "Password saat ini tidak cocok.",
      fieldErrors: { currentPassword: ["Password saat ini tidak cocok."] },
    };
  }

  const { error } = await session.supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    console.error("[settings] password update failed", error.message);
    return {
      status: "error",
      message:
        error.message.toLowerCase().includes("different")
          ? "Password baru harus berbeda dari password sebelumnya."
          : "Password belum bisa diubah. Coba lagi.",
    };
  }

  return { status: "success", message: "Password berhasil diubah. Sesi ini tetap aktif." };
}

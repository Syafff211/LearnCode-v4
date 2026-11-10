import { getAiSettings } from "@/lib/ai/settings";
import { jsonError, jsonOk, requireApiSession } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, supabase } = await requireApiSession();
    const settings = await getAiSettings();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("ai_usage")
      .select("message_count, usage_date")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .maybeSingle();

    if (error) {
      console.error("[ai] usage lookup failed", error.message);
      return jsonError(500, "usage_failed", "Kuota AI belum bisa dibaca. Coba lagi.");
    }

    const used = Number(data?.message_count ?? 0);
    return jsonOk({
      enabled: settings.enabled,
      limit: settings.dailyMessageLimit,
      used,
      remaining: Math.max(0, settings.dailyMessageLimit - used),
      date: today,
    });
  } catch {
    return jsonError(401, "unauthenticated", "Sesi kamu tidak valid. Silakan masuk kembali.");
  }
}

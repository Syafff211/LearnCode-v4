import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getOptionalUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ popupId: z.uuid() }).strict();

function noStore(status: number) {
  return new NextResponse(null, {
    status,
    headers: { "Cache-Control": "no-store, private, max-age=0" },
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) return noStore(503);
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return noStore(403);

  const user = await getOptionalUser();
  if (!user) return noStore(401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStore(400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return noStore(400);

  try {
    const db = await createSupabaseServerClient();
    const { data: popup, error: popupError } = await db
      .from("promotional_popups")
      .select("id, frequency")
      .eq("id", parsed.data.popupId)
      .maybeSingle();
    if (popupError || !popup || popup.frequency !== "once_per_user") return noStore(404);

    const { error } = await db.from("promotional_popup_user_views").insert({
      popup_id: popup.id,
      user_id: user.id,
    });
    if (error && error.code !== "23505") {
      console.error("[promotional-popup] impression write failed", error.message);
      return noStore(503);
    }
    return noStore(204);
  } catch {
    return noStore(503);
  }
}

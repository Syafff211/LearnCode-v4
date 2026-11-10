import { z } from "zod";

import { ApiError, handleRouteError, jsonOk, readJson, requireApiSession } from "@/lib/api";
import { aiConversationLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.uuid();
const renameSchema = z
  .object({
    title: z.string().trim().min(1, "Judul tidak boleh kosong.").max(80, "Judul maksimal 80 karakter."),
  })
  .strict();

function checkLimit(userId: string, action: string) {
  const limited = aiConversationLimiter.check(`conversation-${action}:${userId}`);
  if (!limited.allowed) {
    throw new ApiError(429, "rate_limited", "Terlalu banyak permintaan riwayat. Tunggu sebentar.");
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await requireApiSession();
    checkLimit(user.id, "detail");
    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      throw new ApiError(400, "invalid_id", "ID percakapan tidak valid.");
    }

    const { data: conversation, error } = await supabase
      .from("ai_conversations")
      .select("id, title, lesson_id, updated_at")
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !conversation) {
      throw new ApiError(404, "not_found", "Percakapan tidak ditemukan.");
    }

    const { data: messages, error: messagesError } = await supabase
      .from("ai_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", parsedId.data)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);

    if (messagesError) {
      throw new ApiError(500, "messages_failed", "Pesan percakapan belum bisa dibaca.");
    }

    return jsonOk({
      conversation: {
        id: conversation.id as string,
        title: conversation.title as string,
        lesson_id: (conversation.lesson_id as string | null) ?? null,
        updated_at: conversation.updated_at as string,
      },
      messages: (messages ?? []).map((message) => ({
        id: message.id as string,
        role: message.role as "user" | "assistant",
        content: message.content as string,
        created_at: message.created_at as string,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await requireApiSession();
    checkLimit(user.id, "rename");
    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      throw new ApiError(400, "invalid_id", "ID percakapan tidak valid.");
    }

    const parsedBody = renameSchema.safeParse(await readJson(request));
    if (!parsedBody.success) {
      throw new ApiError(422, "invalid_title", "Judul harus berisi 1–80 karakter.");
    }

    const { data, error } = await supabase
      .from("ai_conversations")
      .update({ title: parsedBody.data.title })
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select("id, title, lesson_id, updated_at")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "rename_failed", "Judul percakapan belum bisa disimpan.");
    }
    if (!data) {
      throw new ApiError(404, "not_found", "Percakapan tidak ditemukan.");
    }

    return jsonOk({
      conversation: {
        id: data.id as string,
        title: data.title as string,
        lesson_id: (data.lesson_id as string | null) ?? null,
        updated_at: data.updated_at as string,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Delete is scoped to the verified account even if RLS is misconfigured. */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user, supabase } = await requireApiSession();
    checkLimit(user.id, "delete");
    const { id } = await context.params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      throw new ApiError(400, "invalid_id", "ID percakapan tidak valid.");
    }

    const { data, error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", parsedId.data)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "delete_failed", "Percakapan belum bisa dihapus. Coba lagi.");
    }
    if (!data) {
      throw new ApiError(404, "not_found", "Percakapan tidak ditemukan.");
    }

    return jsonOk({ deleted: true, id: parsedId.data });
  } catch (error) {
    return handleRouteError(error);
  }
}

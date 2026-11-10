import { z } from "zod";

import { ApiError, handleRouteError, jsonOk, readJson, requireApiSession } from "@/lib/api";
import { aiConversationLimiter } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const searchSchema = z.string().trim().max(80, "Pencarian maksimal 80 karakter.");
const searchBodySchema = z.object({ query: searchSchema }).strict();
type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
  lesson_id: string | null;
};

async function findConversations(rawSearch: string) {
  const { user, supabase } = await requireApiSession();
  const limited = aiConversationLimiter.check(`conversation-list:${user.id}`);
  if (!limited.allowed) {
    throw new ApiError(429, "rate_limited", "Terlalu banyak pencarian. Tunggu sebentar lalu coba lagi.");
  }

  const parsedSearch = searchSchema.safeParse(rawSearch);
  if (!parsedSearch.success) {
    throw new ApiError(400, "invalid_search", "Kata pencarian tidak valid.");
  }

  // `%` and `_` are ILIKE wildcards; remove them so they cannot turn a
  // private history search into an unexpectedly broad wildcard scan.
  const search = parsedSearch.data.replace(/[%_]/g, "").trim();
  if (parsedSearch.data && !search) return { conversations: [] as ConversationSummary[] };

  const selectColumns = "id, title, updated_at, lesson_id";
  if (!search) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select(selectColumns)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) {
      throw new ApiError(500, "conversation_search_failed", "Riwayat belum bisa dimuat. Coba lagi.");
    }
    return { conversations: (data ?? []) as unknown as ConversationSummary[] };
  }

  const [titleMatches, messageMatches] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select(selectColumns)
      .eq("user_id", user.id)
      .ilike("title", `%${search}%`)
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("ai_messages")
      .select("conversation_id")
      .eq("user_id", user.id)
      .ilike("content", `%${search}%`)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (titleMatches.error || messageMatches.error) {
    throw new ApiError(500, "conversation_search_failed", "Riwayat belum bisa dicari. Coba lagi.");
  }

  const matchedIds = new Set<string>();
  const titleRows = (titleMatches.data ?? []) as unknown as ConversationSummary[];
  for (const conversation of titleRows) matchedIds.add(conversation.id);
  for (const message of messageMatches.data ?? []) {
    if (typeof message.conversation_id === "string") matchedIds.add(message.conversation_id);
  }

  if (matchedIds.size === 0) return { conversations: [] as ConversationSummary[] };

  const { data, error } = await supabase
    .from("ai_conversations")
    .select(selectColumns)
    .eq("user_id", user.id)
    .in("id", [...matchedIds])
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) {
    throw new ApiError(500, "conversation_search_failed", "Riwayat belum bisa dicari. Coba lagi.");
  }

  return { conversations: (data ?? []) as unknown as ConversationSummary[] };
}

/** List private history, or search title and message content with POST. */
export async function GET(request: Request) {
  try {
    const rawSearch = new URL(request.url).searchParams.get("q") ?? "";
    return jsonOk(await findConversations(rawSearch));
  } catch (error) {
    return handleRouteError(error);
  }
}

/** POST keeps potentially private search text out of URL/access logs. */
export async function POST(request: Request) {
  try {
    const parsedBody = searchBodySchema.safeParse(await readJson(request));
    if (!parsedBody.success) {
      throw new ApiError(422, "invalid_search", "Kata pencarian tidak valid.");
    }
    return jsonOk(await findConversations(parsedBody.data.query));
  } catch (error) {
    return handleRouteError(error);
  }
}

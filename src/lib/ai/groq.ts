import "server-only";

import { getGroqConfig } from "@/lib/env";

export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqFailureCode =
  | "ai_unconfigured"
  | "invalid_model"
  | "rate_limited"
  | "timeout"
  | "provider_error"
  | "network_error";

export class GroqError extends Error {
  readonly code: GroqFailureCode;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;

  constructor(
    code: GroqFailureCode,
    message: string,
    options: { retryable?: boolean; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = "GroqError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

type ParsedGroqEvent = { done: true; deltas: [] } | { done: false; deltas: string[] };

function parseGroqEvent(eventText: string): ParsedGroqEvent {
  const dataLines = eventText
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""));
  if (dataLines.length === 0) return { done: false, deltas: [] };

  const payload = dataLines.join("\n").trim();
  if (!payload) return { done: false, deltas: [] };
  if (payload === "[DONE]") return { done: true, deltas: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { done: false, deltas: [] };
  }

  if (typeof parsed !== "object" || parsed === null) return { done: false, deltas: [] };
  if ("error" in parsed) {
    const raw = (parsed as { error?: { code?: string; message?: string } }).error;
    console.error("[groq] stream error", raw?.code ?? raw?.message ?? "unknown");
    throw new GroqError(
      raw?.code === "rate_limit_exceeded" ? "rate_limited" : "provider_error",
      raw?.code === "rate_limit_exceeded"
        ? "Kuota penyedia AI sedang penuh. Coba lagi sebentar."
        : "Layanan AI menghentikan respons. Silakan coba lagi.",
      { retryable: true },
    );
  }

  const choice = (parsed as {
    choices?: { delta?: { content?: string | null } }[];
  }).choices?.[0];
  const delta = choice?.delta?.content;
  return {
    done: false,
    deltas: typeof delta === "string" && delta.length > 0 ? [delta] : [],
  };
}

/**
 * Streams assistant text deltas from Groq's OpenAI-compatible endpoint.
 * Only text is yielded; provider metadata and error payloads stay server-side.
 */
export async function* streamGroqCompletion(
  messages: GroqMessage[],
  options: {
    signal?: AbortSignal;
    temperature?: number;
    model?: string;
    maxOutputTokens?: number;
  } = {},
): AsyncGenerator<string, void, unknown> {
  const config = getGroqConfig();
  if (!config) {
    throw new GroqError(
      "ai_unconfigured",
      "AI Tutor belum dikonfigurasi. Tambahkan GROQ_API_KEY pada environment server.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), config.timeoutMs);
  const onAbort = () => controller.abort("client_aborted");
  if (options.signal?.aborted) onAbort();
  else options.signal?.addEventListener("abort", onAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        // Model and output budget come from admin settings, clamped in the
        // database; the API key still comes only from the server environment.
        model: options.model ?? config.model,
        messages,
        stream: true,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxOutputTokens ?? config.maxOutputTokens,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
    if (controller.signal.aborted) {
      const reason = controller.signal.reason;
      if (reason === "timeout") {
        throw new GroqError("timeout", "AI Tutor tidak merespons tepat waktu. Coba lagi.", {
          retryable: true,
        });
      }
      throw new GroqError("network_error", "Permintaan dibatalkan.", { retryable: false });
    }
    console.error("[groq] network error", error instanceof Error ? error.message : error);
    throw new GroqError(
      "network_error",
      "Tidak dapat menghubungi layanan AI. Periksa koneksi lalu coba lagi.",
      { retryable: true },
    );
  }

  if (!response.ok || !response.body) {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
    await handleGroqHttpError(response);
    throw new GroqError("provider_error", "Layanan AI sedang bermasalah.", { retryable: true });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outputChars = 0;
  const maxChars = Math.max(4000, config.maxOutputTokens * 6);

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const parsedEvent = parseGroqEvent(event);
        if (parsedEvent.done) return;
        for (const delta of parsedEvent.deltas) {
          outputChars += delta.length;
          if (outputChars > maxChars) {
            yield "\n\n…";
            try {
              await reader.cancel();
            } catch {
              // The upstream may already have closed.
            }
            return;
          }
          yield delta;
        }
      }
    }

    buffer += decoder.decode();
    buffer = buffer.replace(/\r\n/g, "\n");
    const finalEvent = buffer.trim();
    if (finalEvent) {
      const parsedEvent = parseGroqEvent(finalEvent);
      if (parsedEvent.done) return;
      for (const delta of parsedEvent.deltas) {
        outputChars += delta.length;
        if (outputChars > maxChars) {
          yield "\n\n…";
          try {
            await reader.cancel();
          } catch {
            // The upstream may already have closed.
          }
          return;
        }
        yield delta;
      }
    }

    throw new GroqError(
      "network_error",
      "Koneksi ke AI terputus sebelum jawaban selesai.",
      { retryable: true },
    );
  } catch (error) {
    if (error instanceof GroqError) throw error;
    if (controller.signal.aborted) {
      const reason = controller.signal.reason;
      if (reason === "timeout") {
        throw new GroqError("timeout", "AI Tutor tidak merespons tepat waktu. Coba lagi.", {
          retryable: true,
        });
      }
      return;
    }
    console.error("[groq] stream read failed", error instanceof Error ? error.message : error);
    throw new GroqError(
      "network_error",
      "Koneksi ke AI terputus sebelum jawaban selesai.",
      { retryable: true },
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
    try {
      reader.releaseLock();
    } catch {
      // Already released.
    }
  }
}

async function handleGroqHttpError(response: Response): Promise<never> {
  let providerCode: string | undefined;
  let providerMessage: string | undefined;
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string };
    };
    providerCode = body.error?.code;
    providerMessage = body.error?.message;
  } catch {
    // Non-JSON error body.
  }

  console.error("[groq] HTTP error", {
    status: response.status,
    code: providerCode,
    message: providerMessage?.slice(0, 160),
  });

  if (response.status === 401 || response.status === 403) {
    throw new GroqError(
      "ai_unconfigured",
      "Konfigurasi AI Tutor tidak valid. Periksa GROQ_API_KEY pada server.",
    );
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new GroqError("rate_limited", "Batas permintaan AI tercapai. Coba lagi sebentar.", {
      retryable: true,
      retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 20,
    });
  }
  if (response.status === 404 || providerCode === "model_not_found" || providerCode === "invalid_model") {
    throw new GroqError(
      "invalid_model",
      "Model AI yang dikonfigurasi tidak tersedia. Periksa variabel GROQ_MODEL.",
    );
  }
  if (response.status === 408 || response.status === 504) {
    throw new GroqError("timeout", "Layanan AI tidak merespons tepat waktu. Coba lagi.", {
      retryable: true,
    });
  }
  throw new GroqError("provider_error", "Layanan AI sedang bermasalah. Coba lagi nanti.", {
    retryable: response.status >= 500,
  });
}

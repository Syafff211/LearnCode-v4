import { afterEach, describe, expect, it, vi } from "vitest";

import { GroqError, streamGroqCompletion } from "@/lib/ai/groq";

function streamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status: 200, headers: { "Content-Type": "text/event-stream" } },
  );
}

async function collectStream() {
  const deltas: string[] = [];
  for await (const delta of streamGroqCompletion([{ role: "user", content: "Hello" }])) {
    deltas.push(delta);
  }
  return deltas;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Groq SSE stream parsing", () => {
  it("handles CRLF boundaries split across chunks and emits only text deltas", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key-not-a-real-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        streamResponse([
          'data: {"choices":[{"delta":{"content":"Halo"}}]}\r',
          "\n",
          "\r",
          "\n",
          'data: {"choices":[{"delta":{"content":" dunia"}}]}\r\n\r\n',
          "data: [DONE]\r\n\r\n",
        ]),
      ),
    );

    await expect(collectStream()).resolves.toEqual(["Halo", " dunia"]);
  });

  it("reports a truncated provider stream instead of treating it as complete", async () => {
    vi.stubEnv("GROQ_API_KEY", "test-key-not-a-real-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        streamResponse(['data: {"choices":[{"delta":{"content":"sebagian"}}]}\n\n']),
      ),
    );

    await expect(collectStream()).rejects.toBeInstanceOf(GroqError);
    await expect(collectStream()).rejects.toMatchObject({ code: "network_error", retryable: true });
  });
});

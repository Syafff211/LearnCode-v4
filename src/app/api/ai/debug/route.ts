import { runAiTutor } from "@/lib/ai/service";
import { handleRouteError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return await runAiTutor(request, "debug_code");
  } catch (error) {
    return handleRouteError(error);
  }
}

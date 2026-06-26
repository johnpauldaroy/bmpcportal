import { NextResponse } from "next/server";
import { assistantMessageSchema } from "@/features/ai/schemas";
import { answerKnowledgeBaseQuestion } from "@/features/ai/openai-service";
import { jsonError } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { enforceSameOriginRequest } from "@/lib/server/security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const originError = await enforceSameOriginRequest(request);
  if (originError) return originError;

  const rateLimitError = await enforceRateLimit({
    key: "ai-chat",
    limit: 20,
    windowSeconds: 60
  });
  if (rateLimitError) return rateLimitError;

  const supabase = await createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("Authentication is required.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = assistantMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid question for the BMPC knowledge base." },
      { status: 400 }
    );
  }

  try {
    const result = await answerKnowledgeBaseQuestion(parsed.data.message);
    return NextResponse.json({ answer: result.answer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to query the BMPC knowledge base.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import OpenAI from "openai";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const knowledgeOnlyInstructions = [
  "You are the BMPC portal assistant.",
  "Answer only using the Barbaza Multi-Purpose Cooperative knowledge-base excerpts included in the user message.",
  "Do not access or infer member-specific balances, loans, insurance, mortuary, rewards, referrals, IDs, certificates, or private account data.",
  "If the answer is not grounded in the provided excerpts, say that the knowledge base does not contain enough information."
].join(" ");

const fallbackAnswer = "The knowledge base does not contain enough information.";

async function getKnowledgeBaseContext() {
  const admin = createAdminClient();
  const { data: documents, error } = await admin
    .from("knowledge_documents")
    .select("title, storage_path, content_type, sync_status")
    .in("content_type", ["text/plain", "text/markdown"])
    .in("sync_status", ["pending", "synced"])
    .order("updated_at", { ascending: false })
    .limit(4);

  if (error || !documents?.length) {
    return "";
  }

  const excerpts: string[] = [];

  for (const document of documents) {
    const download = await admin.storage
      .from("knowledge-documents")
      .download(document.storage_path);

    if (download.error || !download.data) {
      continue;
    }

    const text = await download.data.text();
    const excerpt = text.replace(/\s+/g, " ").trim().slice(0, 3000);

    if (excerpt) {
      excerpts.push(`Source: ${document.title}\n${excerpt}`);
    }
  }

  return excerpts.join("\n\n---\n\n").slice(0, 12000);
}

export async function answerKnowledgeBaseQuestion(message: string) {
  const env = getServerEnv();

  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is required.");
  }

  if (env.OPENROUTER_MODEL !== "openrouter/free" && !env.OPENROUTER_MODEL.endsWith(":free")) {
    throw new Error("OPENROUTER_MODEL must be openrouter/free or an OpenRouter :free model.");
  }

  const knowledgeBaseContext = await getKnowledgeBaseContext();
  if (!knowledgeBaseContext) {
    return {
      answer: fallbackAnswer,
      raw: null
    };
  }

  const client = new OpenAI({
    apiKey: env.OPENROUTER_API_KEY,
    baseURL: env.OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer": env.NEXT_PUBLIC_APP_URL,
      "X-Title": env.NEXT_PUBLIC_APP_NAME
    }
  });

  const response = await client.chat.completions.create({
    model: env.OPENROUTER_MODEL,
    messages: [
      {
        role: "system",
        content: knowledgeOnlyInstructions
      },
      {
        role: "user",
        content: [
          "Knowledge-base excerpts:",
          knowledgeBaseContext || "[No approved BMPC knowledge-base excerpts were retrieved.]",
          "",
          "Question:",
          message
        ].join("\n")
      }
    ]
  });
  const answer = response.choices[0]?.message.content;

  return {
    answer: knowledgeBaseContext ? answer || fallbackAnswer : fallbackAnswer,
    raw: response
  };
}

"use client";

import { Send } from "@/components/ui/icon";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AssistantPanel() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    const userMessage = message.trim();
    setMessages((current) => [...current, { role: "user", content: userMessage }]);
    setMessage("");
    setIsLoading(true);

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    });
    const data = (await response.json()) as { answer?: string; error?: string };

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: data.answer ?? data.error ?? "Unable to answer from the knowledge base."
      }
    ]);
    setIsLoading(false);
  }

  return (
    <section className="rounded-xl border border-[#E2E8F0] bg-white md-elevation-1">
      <div className="min-h-[280px] space-y-3 p-4">
        {messages.length === 0 ? (
          <p className="text-sm leading-6 text-[#475569]">
            Ask a question about BMPC policies, services, or uploaded documents.
          </p>
        ) : (
          messages.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={
                item.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-[#3673FC] p-3 text-sm leading-6 text-white"
                  : "mr-auto max-w-[85%] rounded-lg bg-[#F1F5F9] p-3 text-sm leading-6 text-[#0F172A]"
              }
            >
              {item.content}
            </div>
          ))
        )}
        {isLoading ? <p className="text-sm text-[#475569]">Checking knowledge base...</p> : null}
      </div>
      <form className="flex gap-2 border-t border-[#E2E8F0] p-3" onSubmit={submit}>
        <input
          className="focus-ring min-h-11 flex-1 rounded-md border border-[#E2E8F0] px-3 text-sm"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask from BMPC documents"
        />
        <Button type="submit" disabled={isLoading}>
          <Send aria-hidden size={18} />
          Send
        </Button>
      </form>
    </section>
  );
}

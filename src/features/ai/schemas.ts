import { z } from "zod";

export const assistantMessageSchema = z.object({
  message: z.string().min(3).max(2000)
});

export type AssistantMessageInput = z.infer<typeof assistantMessageSchema>;

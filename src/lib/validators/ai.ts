import { z } from "zod";

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid().nullable().optional(),
  message: z.string().min(1).max(2000).trim(),
});

export const conversationIdSchema = z.object({
  id: z.string().uuid(),
});

// POST /api/ai/chat — Send message, get Claude response
// Security: withManagementAuth [R23], rate limit 20/min [R47]
// AI context built in Step 5.2 — for now, uses placeholder

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { chatMessageSchema } from "@/lib/validators/ai";
import { createConversation, addMessage, getConversation } from "@/lib/db/queries/ai";

export async function POST(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const body = chatMessageSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      // Get or create conversation
      let convoId = body.data.conversationId ?? null;
      if (!convoId) {
        const convo = await createConversation(ctx.user.id, body.data.message.slice(0, 50));
        if (!convo) return Errors.INTERNAL();
        convoId = convo.id;
      }
      const conversationId = convoId as string;

      // Save user message
      await addMessage(conversationId, "user", body.data.message);

      // TODO: Claude API call with cross-org context (Step 5.2)
      // For now, return a placeholder response
      const assistantMessage = "AI assistant is not yet configured. This response will be powered by Claude once the integration is complete (Step 5.2).";
      await addMessage(conversationId, "assistant", assistantMessage);

      return successResponse({
        conversationId,
        message: {
          role: "assistant",
          content: assistantMessage,
        },
      });
    } catch (err) {
      console.error("[ai] chat failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

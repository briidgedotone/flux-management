// POST /api/ai/chat — Send message, get Claude response
// Security: withManagementAuth [R23], rate limit 20/min [R47]
// R36: Context excludes API keys, secrets, test org data
// R37: Responses include verification disclaimer

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { chatMessageSchema } from "@/lib/validators/ai";
import { createConversation, addMessage, getConversation } from "@/lib/db/queries/ai";
import { sendMessage, type ChatMessage } from "@/lib/integrations/claude/client";
import { buildManagementContext } from "@/lib/integrations/claude/context-builder";
import { buildSystemPrompt } from "@/lib/integrations/claude/system-prompt";

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

      // Build conversation history
      const convo = await getConversation(conversationId);
      const history: ChatMessage[] = (convo?.messages ?? [])
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // Build cross-org context and system prompt [R36: excludes test org via is_active=true]
      const context = await buildManagementContext();
      const systemPrompt = buildSystemPrompt(context, ctx.user.name);

      // Call Claude API
      const response = await sendMessage(systemPrompt, history);

      // Save assistant response
      await addMessage(conversationId, "assistant", response.content, response.inputTokens + response.outputTokens);

      return successResponse({
        conversationId,
        message: {
          role: "assistant",
          content: response.content,
        },
      });
    } catch (err) {
      console.error("[ai] chat failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

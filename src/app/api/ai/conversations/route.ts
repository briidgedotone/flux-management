// GET /api/ai/conversations — List user's conversations
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { listConversations } from "@/lib/db/queries/ai";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const conversations = await listConversations(ctx.user.id);
      return successResponse(conversations);
    } catch (err) {
      console.error("[ai] list conversations failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

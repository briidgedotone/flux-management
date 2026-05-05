// GET /api/ai/conversations/:id — Get conversation with messages
// DELETE /api/ai/conversations/:id — Delete conversation
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { conversationIdSchema } from "@/lib/validators/ai";
import { getConversation, deleteConversation } from "@/lib/db/queries/ai";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async () => {
    try {
      const { id } = await params;
      const parsed = conversationIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid conversation ID");

      const conversation = await getConversation(parsed.data.id);
      if (!conversation) return Errors.NOT_FOUND();

      return successResponse(conversation);
    } catch (err) {
      console.error("[ai] get conversation failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async () => {
    try {
      const { id } = await params;
      const parsed = conversationIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid conversation ID");

      const deleted = await deleteConversation(parsed.data.id);
      if (!deleted) return Errors.NOT_FOUND();

      return successResponse({ deleted: true });
    } catch (err) {
      console.error("[ai] delete conversation failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

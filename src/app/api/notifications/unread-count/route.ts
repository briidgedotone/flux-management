// GET /api/notifications/unread-count — Badge count
import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { getUnreadCount } from "@/lib/db/queries/notifications";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const count = await getUnreadCount(ctx.user.id);
      return successResponse({ count });
    } catch (err) {
      console.error("[notifications] unread-count failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

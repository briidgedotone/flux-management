// GET /api/notifications — List management notifications
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { paginatedResponse, Errors } from "@/lib/api/response";
import { notificationListSchema } from "@/lib/validators/notifications";
import { listNotifications } from "@/lib/db/queries/notifications";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const params = notificationListSchema.safeParse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      if (!params.success) return Errors.VALIDATION(params.error.issues[0].message);

      const result = await listNotifications(ctx.user.id, params.data);
      return paginatedResponse(result.data, result.total, result.page, result.limit);
    } catch (err) {
      console.error("[notifications] list failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

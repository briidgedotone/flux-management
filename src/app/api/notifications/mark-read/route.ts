// PUT /api/notifications/mark-read — Mark one or all as read
import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { markReadSchema } from "@/lib/validators/notifications";
import { markAsRead } from "@/lib/db/queries/notifications";

export async function PUT(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const body = markReadSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      await markAsRead(ctx.user.id, body.data.notificationId);
      return successResponse({ success: true });
    } catch (err) {
      console.error("[notifications] mark-read failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

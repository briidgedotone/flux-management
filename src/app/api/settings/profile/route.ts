// GET /api/settings/profile — Current user's profile
// PUT /api/settings/profile — Update name, phone, notification prefs

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { profileUpdateSchema } from "@/lib/validators/settings";
import { getUserById } from "@/lib/db/queries/users";
import { query } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const user = await getUserById(ctx.user.id);
      if (!user) return Errors.NOT_FOUND();

      return successResponse({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
        notificationPrefs: user.notification_prefs,
      });
    } catch (err) {
      console.error("[settings] profile get failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

export async function PUT(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    try {
      const body = profileUpdateSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const fields: string[] = [];
      const params: unknown[] = [];
      let idx = 1;

      if (body.data.name !== undefined) {
        fields.push(`name = $${idx++}`);
        params.push(body.data.name);
      }
      if (body.data.phone !== undefined) {
        fields.push(`phone = $${idx++}`);
        params.push(body.data.phone);
      }
      if (body.data.notificationPrefs !== undefined) {
        fields.push(`notification_prefs = notification_prefs || $${idx++}::jsonb`);
        params.push(JSON.stringify(body.data.notificationPrefs));
      }

      if (fields.length === 0) return Errors.VALIDATION("No fields to update");

      fields.push("updated_at = now()");
      params.push(ctx.user.id);

      const result = await query(
        `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} AND is_active = true
         RETURNING id, name, email, phone, role, avatar_url, notification_prefs`,
        params,
      );

      if (!result.rows[0]) return Errors.NOT_FOUND();

      return successResponse(result.rows[0]);
    } catch (err) {
      console.error("[settings] profile update failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

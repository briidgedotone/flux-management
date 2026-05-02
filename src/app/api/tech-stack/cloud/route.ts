// POST/PUT/DELETE /api/tech-stack/cloud — CRUD for cloud services (co-ceo/director only)

import { NextRequest } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { createCloudService, updateCloudService, deleteCloudService } from "@/lib/db/queries/tech-stack";
import { logActivity } from "@/lib/db/queries/activity-log";
import { z } from "zod";

const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200).trim(),
  provider: z.string().max(200).optional(),
  tier: z.string().max(200).optional(),
  status: z.enum(["Active", "Expiring Soon", "Expired"]).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).trim().optional(),
  provider: z.string().max(200).nullable().optional(),
  tier: z.string().max(200).nullable().optional(),
  status: z.enum(["Active", "Expiring Soon", "Expired"]).optional(),
});

export async function POST(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async (ctx) => {
    try {
      const body = createSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const result = await createCloudService(body.data);
      await logActivity(ctx.user.id, "created", "cloud_service", result.id, body.data.organizationId, `Added cloud service: ${body.data.name}`);
      return successResponse(result, 201);
    } catch (err) {
      console.error("[tech-stack/cloud] create failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

export async function PUT(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async (ctx) => {
    try {
      const body = updateSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const { id, ...data } = body.data;
      const result = await updateCloudService(id, data);
      if (!result) return Errors.NOT_FOUND();
      await logActivity(ctx.user.id, "updated", "cloud_service", id, null, `Updated cloud service`);
      return successResponse(result);
    } catch (err) {
      console.error("[tech-stack/cloud] update failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async (ctx) => {
    try {
      const id = request.nextUrl.searchParams.get("id");
      if (!id) return Errors.VALIDATION("id is required");

      const result = await deleteCloudService(id);
      if (!result) return Errors.NOT_FOUND();
      await logActivity(ctx.user.id, "deleted", "cloud_service", id, null, `Deleted cloud service`);
      return successResponse(result);
    } catch (err) {
      console.error("[tech-stack/cloud] delete failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

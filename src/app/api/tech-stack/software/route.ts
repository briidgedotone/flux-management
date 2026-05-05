// POST /api/tech-stack/software — Create a software subscription (co-ceo/director only)
// DELETE /api/tech-stack/software?id=... — Delete a software subscription

import { NextRequest } from "next/server";
import { withRole } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { createSoftwareSubscription, updateSoftwareSubscription, deleteSoftwareSubscription } from "@/lib/db/queries/tech-stack";
import { logActivity } from "@/lib/db/queries/activity-log";
import { z } from "zod";

const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(200).trim(),
  licenseCount: z.number().int().min(0).optional(),
  costPerMonth: z.number().min(0).optional(),
  billingCycle: z.string().max(50).optional(),
  renewalDate: z.string().optional(),
  status: z.enum(["Active", "Expiring Soon", "Expired"]).optional(),
  adminContact: z.string().max(200).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).trim().optional(),
  licenseCount: z.number().int().min(0).nullable().optional(),
  costPerMonth: z.number().min(0).nullable().optional(),
  billingCycle: z.string().max(50).nullable().optional(),
  renewalDate: z.string().nullable().optional(),
  status: z.enum(["Active", "Expiring Soon", "Expired"]).optional(),
  adminContact: z.string().max(200).nullable().optional(),
});

export async function POST(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async (ctx) => {
    try {
      const body = createSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const result = await createSoftwareSubscription(body.data);
      await logActivity(ctx.user.id, "created", "software_subscription", result.id, body.data.organizationId, `Added software: ${body.data.name}`);
      return successResponse(result, 201);
    } catch (err) {
      console.error("[tech-stack/software] create failed:", (err as Error).message);
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
      const result = await updateSoftwareSubscription(id, data);
      if (!result) return Errors.NOT_FOUND();
      await logActivity(ctx.user.id, "updated", "software_subscription", id, null, `Updated software subscription`);
      return successResponse(result);
    } catch (err) {
      console.error("[tech-stack/software] update failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withRole(request, ["co-ceo", "director"], async (ctx) => {
    try {
      const id = request.nextUrl.searchParams.get("id");
      if (!id) return Errors.VALIDATION("id is required");

      const result = await deleteSoftwareSubscription(id);
      if (!result) return Errors.NOT_FOUND();
      await logActivity(ctx.user.id, "deleted", "software_subscription", id, null, `Deleted software subscription`);
      return successResponse(result);
    } catch (err) {
      console.error("[tech-stack/software] delete failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

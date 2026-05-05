// GET /api/clients/:id — Client detail
// PUT /api/clients/:id — Update client profile (co-ceo/director only) [R24]
// Security: withManagementAuth [R23], withRole for PUT, audit log on update [R29]

import { NextRequest } from "next/server";
import { withManagementAuth, withRole } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { clientIdSchema, clientUpdateSchema } from "@/lib/validators/clients";
import { getClient, updateClientProfile, createClientProfile } from "@/lib/db/queries/clients";
import { logActivity } from "@/lib/db/queries/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async () => {
    try {
      const { id } = await params;
      const parsed = clientIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid client ID");

      const client = await getClient(parsed.data.id);
      if (!client) return Errors.NOT_FOUND();

      return successResponse(client);
    } catch (err) {
      console.error("[clients] detail failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withRole(request, ["co-ceo", "director"], async (ctx) => {
    try {
      const { id } = await params;
      const parsed = clientIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid client ID");

      const body = clientUpdateSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      // Try update first, if no profile exists, create one
      let result = await updateClientProfile(parsed.data.id, body.data);
      if (!result) {
        result = await createClientProfile(parsed.data.id, body.data);
      }
      if (!result) return Errors.INTERNAL();

      // R29: Audit log
      await logActivity(
        ctx.user.id,
        "updated",
        "client",
        parsed.data.id,
        parsed.data.id,
        `Updated client profile`,
        body.data,
      );

      return successResponse(result);
    } catch (err) {
      console.error("[clients] update failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

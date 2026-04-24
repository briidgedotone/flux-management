// GET /api/team/:id — Team member detail
// PUT /api/team/:id — Update team member (co-ceo/director only) [R24]
// Security: withManagementAuth [R23], audit log on update [R29]

import { NextRequest } from "next/server";
import { withManagementAuth, withRole } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { teamMemberIdSchema, teamUpdateSchema } from "@/lib/validators/team";
import { getTeamMember, updateTeamMember } from "@/lib/db/queries/team";
import { logActivity } from "@/lib/db/queries/activity-log";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withManagementAuth(request, async () => {
    try {
      const { id } = await params;
      const parsed = teamMemberIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid team member ID");

      const member = await getTeamMember(parsed.data.id);
      if (!member) return Errors.NOT_FOUND();

      return successResponse(member);
    } catch (err) {
      console.error("[team] detail failed:", (err as Error).message);
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
      const parsed = teamMemberIdSchema.safeParse({ id });
      if (!parsed.success) return Errors.VALIDATION("Invalid team member ID");

      const body = teamUpdateSchema.safeParse(await request.json());
      if (!body.success) return Errors.VALIDATION(body.error.issues[0].message);

      const result = await updateTeamMember(parsed.data.id, body.data);
      if (!result) return Errors.NOT_FOUND();

      await logActivity(ctx.user.id, "updated", "team_member", parsed.data.id, null, `Updated team member profile`, body.data);

      return successResponse(result);
    } catch (err) {
      console.error("[team] update failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

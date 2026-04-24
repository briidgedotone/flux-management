// GET /api/team — List all team members with computed metrics
// Security: withManagementAuth [R23]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse, Errors } from "@/lib/api/response";
import { listTeamMembers } from "@/lib/db/queries/team";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async () => {
    try {
      const members = await listTeamMembers();
      return successResponse(members);
    } catch (err) {
      console.error("[team] list failed:", (err as Error).message);
      return Errors.INTERNAL();
    }
  });
}

// GET /api/auth/me — return current user info
// Security: requires auth [SO §4] no sensitive fields exposed
// No organizationId returned (management users are cross-org) [R27]

import { NextRequest } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  return withManagementAuth(request, async (ctx) => {
    return successResponse({
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
    });
  });
}

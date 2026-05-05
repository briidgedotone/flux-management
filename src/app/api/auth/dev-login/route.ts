// GET /api/auth/dev-login — testing login bypass
// Accepts ?role=co-ceo|director|employee to log in as any user with that role.
// BLOCKED unless ENABLE_TEST_LOGIN=true is set.

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { createSession } from "@/lib/auth/session";
import type { AuthUser } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_TEST_LOGIN !== "true") {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }

  const role = request.nextUrl.searchParams.get("role") ?? "co-ceo";

  // Find any active management user with this role
  const { rows } = await query<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>(
    `SELECT id, email, name, role
     FROM users WHERE role = $1 AND is_active = true AND role != 'client'
     ORDER BY name LIMIT 1`,
    [role],
  );

  if (!rows[0]) {
    return NextResponse.json(
      { error: { code: "NO_USERS", message: `No user with role "${role}" found` } },
      { status: 404 },
    );
  }

  const user: AuthUser = {
    id: rows[0].id,
    email: rows[0].email,
    name: rows[0].name,
    role: rows[0].role as AuthUser["role"],
  };

  await createSession(user);

  return NextResponse.redirect(new URL("/dashboard", APP_URL));
}

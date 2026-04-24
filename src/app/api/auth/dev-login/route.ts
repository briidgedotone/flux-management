// GET /api/auth/dev-login — testing login bypass
// Creates a real session using a seed user, skipping Azure AD.
// Accepts optional ?email= param to log in as a specific user.
// BLOCKED unless ENABLE_TEST_LOGIN=true is set.
//
// Test URLs:
//   /api/auth/dev-login                              → Brandon Devier (default)
//   /api/auth/dev-login?email=zack@fluxtech.com      → Zack Devier
//   /api/auth/dev-login?email=cameron@fluxtech.com   → Cameron (employee)

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

  const email = request.nextUrl.searchParams.get("email") ?? "brandon@fluxtech.com";

  // R17: No SELECT * — specify columns
  // R25: Reject client role users from management portal
  const { rows } = await query<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>(
    `SELECT id, email, name, role
     FROM users WHERE email = $1 AND is_active = true AND role != 'client' LIMIT 1`,
    [email],
  );

  if (!rows[0]) {
    return NextResponse.json(
      { error: { code: "NO_USERS", message: `Management user ${email} not found` } },
      { status: 404 },
    );
  }

  // No organizationId for management users [R27]
  const user: AuthUser = {
    id: rows[0].id,
    email: rows[0].email,
    name: rows[0].name,
    role: rows[0].role as AuthUser["role"],
  };

  await createSession(user);

  return NextResponse.redirect(new URL("/dashboard", APP_URL));
}

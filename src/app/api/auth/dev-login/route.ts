// GET /api/auth/dev-login — testing login bypass
// Accepts ?role=co-ceo|director|employee to log in as any user with that role.
// BLOCKED unless ENABLE_TEST_LOGIN=true is set.

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import { SignJWT } from "jose";
import { randomUUID } from "crypto";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET ?? "";
const COOKIE_NAME = "flux-management-session";
const MAX_AGE = 86400;
const isProduction = process.env.NODE_ENV === "production";

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_TEST_LOGIN !== "true") {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Not found" } },
      { status: 404 },
    );
  }

  try {
    const role = request.nextUrl.searchParams.get("role") ?? "co-ceo";

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

    // Create JWT — use role label as display name (temporary, no real names in dev login)
    const roleLabels: Record<string, string> = { "co-ceo": "Co-CEO", director: "Director", employee: "Employee" };
    const token = await new SignJWT({
      sub: rows[0].id,
      role: rows[0].role,
      email: rows[0].email,
      name: roleLabels[rows[0].role] ?? rows[0].role,
      jti: randomUUID(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${MAX_AGE}s`)
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Set cookie on redirect response directly
    const response = NextResponse.redirect(new URL("/dashboard", APP_URL));
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    return response;
  } catch (err) {
    console.error("[dev-login] failed:", (err as Error).message);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Login failed" } },
      { status: 500 },
    );
  }
}

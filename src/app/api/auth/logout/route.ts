// GET|POST /api/auth/logout — revoke session, clear cookie, redirect to login
// Security: requires auth [SO §3]

import { NextRequest, NextResponse } from "next/server";
import { withManagementAuth } from "@/lib/auth/middleware";
import { destroySession, revokeSession, getSessionJti } from "@/lib/auth/session";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

async function handleLogout(request: NextRequest) {
  return withManagementAuth(request, async () => {
    // Revoke the JTI so the token can't be reused
    const jti = await getSessionJti(request);
    if (jti) revokeSession(jti);

    // Clear session cookie
    await destroySession();

    return NextResponse.redirect(`${APP_URL}/login`);
  });
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

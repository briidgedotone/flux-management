// GET|POST /api/auth/logout — revoke session, clear cookie, redirect to login
// NOTE: Does NOT use withManagementAuth — logout must always work,
// even if the user's DB record is missing or role changed.

import { NextRequest, NextResponse } from "next/server";
import { destroySession, revokeSession, getSessionJti } from "@/lib/auth/session";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

async function handleLogout(request: NextRequest) {
  // Try to revoke the JTI (best effort — don't block logout if this fails)
  try {
    const jti = await getSessionJti(request);
    if (jti) revokeSession(jti);
  } catch {
    // Ignore — cookie may be invalid/expired, that's fine
  }

  // Always clear session cookie
  await destroySession();

  return NextResponse.redirect(`${APP_URL}/login`);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

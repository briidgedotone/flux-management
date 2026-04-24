// GET /api/auth/login — redirect to Azure AD
// Security: PUBLIC route (no auth middleware), rate limited by IP [SO §6]

import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl } from "@/lib/auth/azure-ad";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = checkRateLimit(`ip:${ip}:login`, RateLimits.AUTH.limit, RateLimits.AUTH.windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const { url, state, nonce, codeVerifier } = buildAuthorizationUrl();

  const response = NextResponse.redirect(url);

  // Store state, nonce, code_verifier in short-lived cookies for callback verification
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 minutes
  };

  response.cookies.set("oauth_state", state, cookieOptions);
  response.cookies.set("oauth_nonce", nonce, cookieOptions);
  response.cookies.set("oauth_code_verifier", codeVerifier, cookieOptions);

  return response;
}

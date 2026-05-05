// GET /api/auth/callback — handle Azure AD OAuth2 callback
// Security: PUBLIC route. Validates state, nonce, PKCE. Rate limited by IP. [SO §3]

import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, validateIdToken } from "@/lib/auth/azure-ad";
import { createSession } from "@/lib/auth/session";
import { getUserByAzureOid, updateUserLastLogin } from "@/lib/db/queries/users";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import type { AuthUser } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = checkRateLimit(`ip:${ip}:callback`, RateLimits.AUTH.limit, RateLimits.AUTH.windowMs);
  if (!rl.allowed) {
    return NextResponse.redirect(`${APP_URL}/login?error=rate_limited`);
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const error = searchParams.get("error");

  // Azure AD returned an error
  if (error) {
    console.error("[auth/callback] Azure AD error:", error);
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  if (!code || !returnedState) {
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  // Read OAuth cookies
  const storedState = request.cookies.get("oauth_state")?.value;
  const storedNonce = request.cookies.get("oauth_nonce")?.value;
  const codeVerifier = request.cookies.get("oauth_code_verifier")?.value;

  if (!storedState || !storedNonce || !codeVerifier) {
    console.error("[auth/callback] missing OAuth cookies");
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  // Verify state parameter [SO §3]
  if (returnedState !== storedState) {
    console.error("[auth/callback] state mismatch");
    return NextResponse.redirect(`${APP_URL}/login?error=auth_failed`);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // Validate ID token: signature, issuer, audience, expiry, nonce
    const claims = await validateIdToken(tokens.id_token, storedNonce);

    // Look up user by Azure AD OID — pre-provisioned users only
    const user = await getUserByAzureOid(claims.oid);

    if (!user) {
      console.error("[auth/callback] user not found for OID");
      return clearOAuthCookies(
        NextResponse.redirect(`${APP_URL}/login?error=access_denied`),
      );
    }

    if (!user.is_active) {
      console.error("[auth/callback] inactive user attempted login");
      return clearOAuthCookies(
        NextResponse.redirect(`${APP_URL}/login?error=account_disabled`),
      );
    }

    // R25: Reject client role users from management portal
    if (user.role === "client") {
      console.error("[auth/callback] client role user blocked from management portal");
      return clearOAuthCookies(
        NextResponse.redirect(`${APP_URL}/login?error=access_denied`),
      );
    }

    // Create JWT session — no organizationId for management users [R27]
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AuthUser["role"],
    };

    await createSession(authUser);
    await updateUserLastLogin(user.id);

    console.log("[auth/callback] login success:", user.email.replace(/(.{2}).*@/, "$1***@"));

    return clearOAuthCookies(
      NextResponse.redirect(`${APP_URL}/dashboard`),
    );
  } catch (err) {
    console.error("[auth/callback] failed:", (err as Error).message);
    return clearOAuthCookies(
      NextResponse.redirect(`${APP_URL}/login?error=auth_failed`),
    );
  }
}

function clearOAuthCookies(response: NextResponse): NextResponse {
  const expired = { maxAge: 0, path: "/" };
  response.cookies.set("oauth_state", "", expired);
  response.cookies.set("oauth_nonce", "", expired);
  response.cookies.set("oauth_code_verifier", "", expired);
  return response;
}

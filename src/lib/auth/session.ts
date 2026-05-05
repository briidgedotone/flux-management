// JWT session management — see docs/implementation-plan.md Step 2.2
// Security: [SO §3] HTTP-only cookie, 24h expiry, server-side revocation
// Key difference from client portal: NO organizationId in JWT (management users are cross-org)

import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AuthUser } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const COOKIE_NAME = "flux-management-session"; // R26: NOT flux_session
const MAX_AGE = 86400; // 24 hours in seconds
const isProduction = process.env.NODE_ENV === "production";

function getSecretKey() {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(JWT_SECRET);
}

// In-memory revocation set. In production with multiple instances,
// this should be replaced with a Redis set or database table.
const revokedJtis = new Set<string>();

/** Create a signed JWT and set it as an HTTP-only cookie. [SO §3] */
export async function createSession(user: AuthUser): Promise<string> {
  const jti = randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // R27: JWT has NO organizationId — management users are cross-org
  const token = await new SignJWT({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + MAX_AGE)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });

  return jti;
}

interface SessionPayload {
  sub: string;
  role: string;
  email: string;
  name: string;
  jti: string;
  iat: number;
  exp: number;
}

/** Verify JWT from cookie and return AuthUser or null. */
export async function verifySession(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });

    const claims = payload as unknown as SessionPayload;

    // Check revocation
    if (revokedJtis.has(claims.jti)) return null;

    return {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      role: claims.role as AuthUser["role"],
    };
  } catch {
    return null;
  }
}

/** Extract JTI from request cookie (for revocation before destroy). */
export async function getSessionJti(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    return (payload as unknown as SessionPayload).jti ?? null;
  } catch {
    return null;
  }
}

/** Clear the session cookie. */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Revoke a session by JTI (used on logout, forced invalidation). */
export function revokeSession(jti: string) {
  revokedJtis.add(jti);
}

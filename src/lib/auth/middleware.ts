// Auth middleware — see docs/implementation-plan.md Step 2.3
// Security: [SO §4] protects every API route
// Key differences from client portal:
// - withManagementAuth instead of withAuth (no org scoping)
// - Rejects users with 'client' role (R25)
// - No withSyncAuth (management has no sync endpoints)
// - Adds withWebhookAuth for contact form webhook

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./session";
import { getUserById } from "@/lib/db/queries/users";
import { checkRateLimit, RateLimits } from "@/lib/api/rate-limit";
import type { RequestContext, UserRole } from "@/types";

const RATE_LIMIT_429 = NextResponse.json(
  { error: { code: "RATE_LIMITED", message: "Too many requests" } },
  { status: 429 },
);

/** Determine rate limit config based on request path. */
function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith("/api/ai/chat")) return RateLimits.AI_CHAT;
  if (pathname.startsWith("/api/reports")) return RateLimits.REPORTS;
  return RateLimits.DEFAULT;
}

/** Core auth middleware — used by every protected management route. [R23] */
export async function withManagementAuth(
  request: NextRequest,
  handler: (context: RequestContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  // 1. Verify JWT from cookie
  const sessionUser = await verifySession(request);
  if (!sessionUser) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  // 2. Look up user in database, verify is_active
  const dbUser = await getUserById(sessionUser.id);
  if (!dbUser || !dbUser.is_active) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Account not found or deactivated" } },
      { status: 401 },
    );
  }

  // 3. Reject client role users — management portal is internal only [R25]
  if (dbUser.role === "client") {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
      { status: 403 },
    );
  }

  // 4. Rate limit check — keyed by user ID
  const { limit, windowMs } = getRateLimitConfig(request.nextUrl.pathname);
  const rl = checkRateLimit(`user:${dbUser.id}`, limit, windowMs);
  if (!rl.allowed) return RATE_LIMIT_429;

  // 5. Build context — NO organizationId (management users are cross-org) [R27]
  // Use JWT name if available (dev login overrides name to role label)
  const context: RequestContext = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      name: sessionUser.name ?? dbUser.name,
      role: dbUser.role as UserRole,
    },
    role: dbUser.role as UserRole,
  };

  return handler(context);
}

/** Role-based middleware wrapper. [R24] */
export async function withRole(
  request: NextRequest,
  allowedRoles: UserRole[],
  handler: (context: RequestContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  return withManagementAuth(request, async (context) => {
    if (!allowedRoles.includes(context.role)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
        { status: 403 },
      );
    }
    return handler(context);
  });
}

/** Webhook endpoint middleware — API key auth, not JWT. [EA §Contact Form Webhook] */
export async function withWebhookAuth(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const apiSecret = request.headers.get("X-API-Secret");
  if (!apiSecret || apiSecret !== process.env.CONTACT_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid API secret" } },
      { status: 401 },
    );
  }

  // Rate limit webhook — 10/min per key [R47]
  const rl = checkRateLimit("webhook:api-key", RateLimits.WEBHOOK.limit, RateLimits.WEBHOOK.windowMs);
  if (!rl.allowed) return RATE_LIMIT_429;

  return handler();
}

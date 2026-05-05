// Shared test helpers — createAuthRequest(), createTestJWT()
// All helpers use TEST_* constants only — never real user data

import { SignJWT } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-for-unit-tests";

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

/** Create a signed JWT for testing — mimics createSession() without setting cookies. */
export async function createTestJWT(
  userId: string,
  role: string,
  email: string = `${role}@test.flux.internal`,
  name: string = `Test ${role}`,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: userId,
    role,
    email,
    name,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + 86400)
    .sign(getSecretKey());
}

/** Create an expired JWT for testing rejection of expired tokens. */
export async function createExpiredJWT(
  userId: string,
  role: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: userId,
    role,
    email: `${role}@test.flux.internal`,
    name: `Test ${role}`,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now - 90000)
    .setExpirationTime(now - 3600) // expired 1 hour ago
    .sign(getSecretKey());
}

/** Create a NextRequest with a valid flux-management-session cookie. */
export async function createAuthRequest(
  userId: string,
  role: string,
  url: string = "http://localhost:3001/api/test",
  method: string = "GET",
): Promise<NextRequest> {
  const token = await createTestJWT(userId, role);
  const req = new NextRequest(url, { method });
  req.cookies.set("flux-management-session", token);
  return req;
}

/** Create a NextRequest with no auth cookie. */
export function createUnauthRequest(
  url: string = "http://localhost:3001/api/test",
  method: string = "GET",
): NextRequest {
  return new NextRequest(url, { method });
}

/** Create a NextRequest with a webhook API secret header. */
export function createWebhookRequest(
  secret: string,
  body: Record<string, unknown>,
  url: string = "http://localhost:3001/api/contact-submissions/webhook",
): NextRequest {
  return new NextRequest(url, {
    method: "POST",
    headers: { "X-API-Secret": secret, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

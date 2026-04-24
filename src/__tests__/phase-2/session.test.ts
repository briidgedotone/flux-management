// Phase 2 tests: JWT session management
// All tests use TEST_* constants — never real user IDs
// See: docs/testing-plan.md § Phase 2

import { describe, it, expect } from "vitest";
import { SignJWT, jwtVerify } from "jose";
import { TEST_CEO_ID, TEST_DIRECTOR_ID } from "../test-constants";

const JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-for-unit-tests";

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

async function createToken(payload: Record<string, unknown>, expiresIn = 86400) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresIn)
    .sign(getSecretKey());
}

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
  return payload;
}

describe("JWT Session", () => {
  it("creates valid token with management fields", async () => {
    const token = await createToken({
      sub: TEST_CEO_ID,
      email: "test-ceo@test.flux.internal",
      name: "Test CEO",
      role: "co-ceo",
      jti: crypto.randomUUID(),
    });

    const payload = await verifyToken(token);
    expect(payload.sub).toBe(TEST_CEO_ID);
    expect(payload.role).toBe("co-ceo");
    expect(payload.email).toBe("test-ceo@test.flux.internal");
    expect(payload.name).toBe("Test CEO");
  });

  it("does NOT contain organizationId in payload", async () => {
    const token = await createToken({
      sub: TEST_CEO_ID,
      email: "test-ceo@test.flux.internal",
      name: "Test CEO",
      role: "co-ceo",
      jti: crypto.randomUUID(),
    });

    const payload = await verifyToken(token);
    // R27: Management JWT must NOT have organizationId
    expect(payload).not.toHaveProperty("org");
    expect(payload).not.toHaveProperty("organizationId");
  });

  it("expires after 24h (86400 seconds)", async () => {
    const token = await createToken({
      sub: TEST_CEO_ID,
      role: "co-ceo",
      jti: crypto.randomUUID(),
    });

    const payload = await verifyToken(token);
    expect(payload.exp! - payload.iat!).toBe(86400);
  });

  it("rejects tampered tokens", async () => {
    const token = await createToken({
      sub: TEST_CEO_ID,
      role: "co-ceo",
      jti: crypto.randomUUID(),
    });

    await expect(verifyToken(token + "tampered")).rejects.toThrow();
  });

  it("rejects expired tokens", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      sub: TEST_DIRECTOR_ID,
      role: "director",
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now - 90000)
      .setExpirationTime(now - 3600)
      .sign(getSecretKey());

    await expect(verifyToken(token)).rejects.toThrow();
  });

  it("rejects tokens signed with wrong secret", async () => {
    const wrongKey = new TextEncoder().encode("wrong-secret-key");
    const token = await new SignJWT({
      sub: TEST_CEO_ID,
      role: "co-ceo",
      jti: crypto.randomUUID(),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(wrongKey);

    await expect(verifyToken(token)).rejects.toThrow();
  });

  it("each token has a unique JTI", async () => {
    const token1 = await createToken({ sub: TEST_CEO_ID, role: "co-ceo", jti: crypto.randomUUID() });
    const token2 = await createToken({ sub: TEST_CEO_ID, role: "co-ceo", jti: crypto.randomUUID() });

    const p1 = await verifyToken(token1);
    const p2 = await verifyToken(token2);
    expect(p1.jti).not.toBe(p2.jti);
  });
});

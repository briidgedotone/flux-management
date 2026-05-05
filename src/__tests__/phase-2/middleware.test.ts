// Phase 2 tests: Auth middleware (withManagementAuth, withRole)
// All tests use TEST_* constants — never real user IDs
// See: docs/testing-plan.md § Phase 2

import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { withManagementAuth, withRole } from "@/lib/auth/middleware";
import { createAuthRequest, createUnauthRequest } from "../helpers";
import {
  TEST_CEO_ID, TEST_DIRECTOR_ID, TEST_EMPLOYEE_ID, TEST_CLIENT_USER_ID,
} from "../test-constants";

const ok = async () => NextResponse.json({ data: "ok" });

describe("withManagementAuth", () => {
  it("allows co-ceo", async () => {
    const req = await createAuthRequest(TEST_CEO_ID, "co-ceo");
    const res = await withManagementAuth(req, async (ctx) => {
      expect(ctx.user.role).toBe("co-ceo");
      expect(ctx.role).toBe("co-ceo");
      return NextResponse.json({ data: "ok" });
    });
    expect(res.status).toBe(200);
  });

  it("allows director", async () => {
    const req = await createAuthRequest(TEST_DIRECTOR_ID, "director");
    const res = await withManagementAuth(req, ok);
    expect(res.status).toBe(200);
  });

  it("allows employee", async () => {
    const req = await createAuthRequest(TEST_EMPLOYEE_ID, "employee");
    const res = await withManagementAuth(req, ok);
    expect(res.status).toBe(200);
  });

  it("blocks client role (R25)", async () => {
    const req = await createAuthRequest(TEST_CLIENT_USER_ID, "client");
    const res = await withManagementAuth(req, ok);
    expect(res.status).toBe(403);
  });

  it("returns 401 without cookie", async () => {
    const req = createUnauthRequest();
    const res = await withManagementAuth(req, ok);
    expect(res.status).toBe(401);
  });

  it("returns 401 for invalid/tampered token", async () => {
    const req = createUnauthRequest();
    req.cookies.set("flux-management-session", "invalid.jwt.token");
    const res = await withManagementAuth(req, ok);
    expect(res.status).toBe(401);
  });

  it("error messages are generic — no role details leaked (R18)", async () => {
    // 403 for client role
    const req403 = await createAuthRequest(TEST_CLIENT_USER_ID, "client");
    const res403 = await withManagementAuth(req403, ok);
    const body403 = await res403.json();
    expect(body403.error.message).not.toContain("client");
    expect(body403.error.message).not.toContain("co-ceo");
    expect(body403.error.message).toBe("Insufficient permissions");

    // 401 without cookie
    const req401 = createUnauthRequest();
    const res401 = await withManagementAuth(req401, ok);
    const body401 = await res401.json();
    expect(body401.error.message).toBe("Authentication required");
    expect(body401.error.message).not.toContain("cookie");
    expect(body401.error.message).not.toContain("JWT");
  });

  it("context has no organizationId (R27)", async () => {
    const req = await createAuthRequest(TEST_CEO_ID, "co-ceo");
    await withManagementAuth(req, async (ctx) => {
      expect(ctx).not.toHaveProperty("organizationId");
      expect(ctx.user).not.toHaveProperty("organizationId");
      return NextResponse.json({ data: "ok" });
    });
  });
});

describe("withRole", () => {
  it("co-ceo passes co-ceo/director gate", async () => {
    const req = await createAuthRequest(TEST_CEO_ID, "co-ceo");
    const res = await withRole(req, ["co-ceo", "director"], ok);
    expect(res.status).toBe(200);
  });

  it("director passes co-ceo/director gate", async () => {
    const req = await createAuthRequest(TEST_DIRECTOR_ID, "director");
    const res = await withRole(req, ["co-ceo", "director"], ok);
    expect(res.status).toBe(200);
  });

  it("employee blocked from co-ceo/director gate (R24)", async () => {
    const req = await createAuthRequest(TEST_EMPLOYEE_ID, "employee");
    const res = await withRole(req, ["co-ceo", "director"], ok);
    expect(res.status).toBe(403);
  });

  it("client blocked from co-ceo/director gate", async () => {
    const req = await createAuthRequest(TEST_CLIENT_USER_ID, "client");
    const res = await withRole(req, ["co-ceo", "director"], ok);
    // Client is blocked by withManagementAuth before withRole even checks
    expect(res.status).toBe(403);
  });

  it("employee passes when employee is allowed", async () => {
    const req = await createAuthRequest(TEST_EMPLOYEE_ID, "employee");
    const res = await withRole(req, ["co-ceo", "director", "employee"], ok);
    expect(res.status).toBe(200);
  });
});

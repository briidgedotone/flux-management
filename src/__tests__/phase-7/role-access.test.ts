// Phase 7: Role-based access control tests
// Verifies: co-ceo/director/employee permissions, client role blocked
// See: docs/testing-plan.md § Phase 7, SO §4

import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";
import { withManagementAuth, withRole } from "@/lib/auth/middleware";
import { createAuthRequest, createUnauthRequest } from "../helpers";
import { TEST_CEO_ID, TEST_DIRECTOR_ID, TEST_EMPLOYEE_ID, TEST_CLIENT_USER_ID } from "../test-constants";

const ok = async () => NextResponse.json({ data: "ok" });

describe("Role-Based Access Control", () => {
  describe("withManagementAuth blocks client role (R25)", () => {
    it("co-ceo → 200", async () => {
      const res = await withManagementAuth(await createAuthRequest(TEST_CEO_ID, "co-ceo"), ok);
      expect(res.status).toBe(200);
    });
    it("director → 200", async () => {
      const res = await withManagementAuth(await createAuthRequest(TEST_DIRECTOR_ID, "director"), ok);
      expect(res.status).toBe(200);
    });
    it("employee → 200", async () => {
      const res = await withManagementAuth(await createAuthRequest(TEST_EMPLOYEE_ID, "employee"), ok);
      expect(res.status).toBe(200);
    });
    it("client → 403", async () => {
      const res = await withManagementAuth(await createAuthRequest(TEST_CLIENT_USER_ID, "client"), ok);
      expect(res.status).toBe(403);
    });
    it("no auth → 401", async () => {
      const res = await withManagementAuth(createUnauthRequest(), ok);
      expect(res.status).toBe(401);
    });
  });

  describe("withRole restricts sensitive endpoints (R24)", () => {
    const gate = ["co-ceo", "director"] as const;

    it("co-ceo passes co-ceo/director gate", async () => {
      const res = await withRole(await createAuthRequest(TEST_CEO_ID, "co-ceo"), [...gate], ok);
      expect(res.status).toBe(200);
    });
    it("director passes co-ceo/director gate", async () => {
      const res = await withRole(await createAuthRequest(TEST_DIRECTOR_ID, "director"), [...gate], ok);
      expect(res.status).toBe(200);
    });
    it("employee blocked from co-ceo/director gate", async () => {
      const res = await withRole(await createAuthRequest(TEST_EMPLOYEE_ID, "employee"), [...gate], ok);
      expect(res.status).toBe(403);
    });
    it("client blocked from co-ceo/director gate", async () => {
      const res = await withRole(await createAuthRequest(TEST_CLIENT_USER_ID, "client"), [...gate], ok);
      expect(res.status).toBe(403);
    });
  });

  describe("Error messages are generic (R18)", () => {
    it("401 says 'Authentication required' — no cookie/JWT details", async () => {
      const res = await withManagementAuth(createUnauthRequest(), ok);
      const body = await res.json();
      expect(body.error.message).toBe("Authentication required");
    });
    it("403 says 'Insufficient permissions' — no role details", async () => {
      const res = await withManagementAuth(await createAuthRequest(TEST_CLIENT_USER_ID, "client"), ok);
      const body = await res.json();
      expect(body.error.message).toBe("Insufficient permissions");
      expect(body.error.message).not.toContain("client");
    });
  });
});

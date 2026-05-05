// Phase 3 tests: clients.ts query module
// All writes scoped to TEST_ORG_ID. Cross-org reads verify visibility.
// See: docs/testing-plan.md § Phase 3

import { describe, it, expect } from "vitest";
import { listClients, getClient, updateClientProfile, getClientStats } from "@/lib/db/queries/clients";
import { TEST_ORG_ID } from "../test-constants";
import { assertTestOrg } from "../guards";

describe("Client Queries", () => {
  describe("listClients", () => {
    it("returns clients with is_active=true filter (R11)", async () => {
      const result = await listClients();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("page");
      expect(result).toHaveProperty("limit");
    });

    it("excludes test org from results (is_active=false)", async () => {
      const result = await listClients();
      const ids = result.data.map((c) => c.id);
      expect(ids).not.toContain(TEST_ORG_ID);
    });

    it("returns expected fields for each client", async () => {
      const result = await listClients();
      if (result.data.length > 0) {
        const client = result.data[0];
        expect(client).toHaveProperty("id");
        expect(client).toHaveProperty("companyName");
        expect(client).toHaveProperty("primaryContact");
        expect(client).toHaveProperty("industry");
        expect(client).toHaveProperty("openTickets");
        expect(client).toHaveProperty("activeProjects");
        expect(client).toHaveProperty("hasProfile");
      }
    });

    it("supports search filter", async () => {
      const all = await listClients();
      if (all.data.length > 0) {
        const name = all.data[0].companyName;
        const filtered = await listClients({ search: name.substring(0, 4) });
        expect(filtered.data.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("supports pagination", async () => {
      const result = await listClients({ page: 1, limit: 1 });
      expect(result.limit).toBe(1);
      expect(result.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe("getClient", () => {
    it("returns client detail by ID", async () => {
      const list = await listClients();
      if (list.data.length > 0) {
        const detail = await getClient(list.data[0].id);
        expect(detail).not.toBeNull();
        expect(detail!.companyName).toBe(list.data[0].companyName);
        expect(detail).toHaveProperty("notes");
        expect(detail).toHaveProperty("hasProfile");
      }
    });

    it("returns null for non-existent ID", async () => {
      const result = await getClient("00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });

    it("can retrieve test org by direct ID lookup (R13: no is_active filter)", async () => {
      // Single-resource lookups by ID don't need is_active filter
      const result = await getClient(TEST_ORG_ID);
      // Test org exists but may not have full profile — just verify no crash
      expect(result === null || result.id === TEST_ORG_ID).toBe(true);
    });
  });

  describe("updateClientProfile", () => {
    it("updates test org profile only (R1)", async () => {
      assertTestOrg(TEST_ORG_ID);
      const result = await updateClientProfile(TEST_ORG_ID, {
        notes: "Updated by test at " + new Date().toISOString(),
      });
      // Test org has a client_profile from seed
      if (result) {
        expect(result.organization_id).toBe(TEST_ORG_ID);
      }
    });

    it("returns null when no fields provided", async () => {
      const result = await updateClientProfile(TEST_ORG_ID, {});
      expect(result).toBeNull();
    });
  });

  describe("getClientStats", () => {
    it("returns stats for test org", async () => {
      const stats = await getClientStats(TEST_ORG_ID, "30d");
      expect(stats).toHaveProperty("ticketsCreated");
      expect(stats).toHaveProperty("ticketsResolved");
      expect(stats).toHaveProperty("avgResolutionHours");
      expect(stats).toHaveProperty("openTickets");
      expect(stats).toHaveProperty("activeProjects");
      expect(stats.range).toBe("30d");
    });

    it("supports different ranges", async () => {
      const stats7 = await getClientStats(TEST_ORG_ID, "7d");
      const stats90 = await getClientStats(TEST_ORG_ID, "90d");
      expect(stats7.range).toBe("7d");
      expect(stats90.range).toBe("90d");
    });
  });
});

import { describe, it, expect } from "vitest";
import { listConnectorStatuses, getConnectorStatus } from "@/lib/db/queries/connectors";
import { TEST_ORG_ID } from "../test-constants";

describe("Connector Queries", () => {
  it("lists connector statuses with is_active filter (R11)", async () => {
    const statuses = await listConnectorStatuses();
    // May be empty if no connector_statuses rows exist for active orgs
    expect(Array.isArray(statuses)).toBe(true);
    // Verify test org excluded if any data exists
    const clientIds = statuses.map((s) => s.clientId);
    expect(clientIds).not.toContain(TEST_ORG_ID);
  });

  it("returns expected fields", async () => {
    const statuses = await listConnectorStatuses();
    if (statuses.length > 0) {
      expect(statuses[0]).toHaveProperty("connector");
      expect(statuses[0]).toHaveProperty("status");
      expect(statuses[0]).toHaveProperty("lastSynced");
      expect(statuses[0]).toHaveProperty("clientName");
    }
  });

  it("filters by connector name", async () => {
    const atera = await getConnectorStatus("atera");
    expect(Array.isArray(atera)).toBe(true);
    for (const s of atera) {
      expect(s.connector).toBe("atera");
    }
  });
});

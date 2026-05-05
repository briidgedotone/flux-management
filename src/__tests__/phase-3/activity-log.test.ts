import { describe, it, expect } from "vitest";
import { logActivity, listActivityLog } from "@/lib/db/queries/activity-log";
import { TEST_CEO_ID, TEST_ORG_ID } from "../test-constants";
import { assertTestUser, assertTestOrg } from "../guards";

describe("Activity Log Queries", () => {
  it("logs an activity for test user in test org (R1, R29)", async () => {
    assertTestUser(TEST_CEO_ID);
    assertTestOrg(TEST_ORG_ID);

    const entry = await logActivity(
      TEST_CEO_ID,
      "created",
      "note",
      null,
      TEST_ORG_ID,
      "Test: created internal note from phase-3",
    );
    expect(entry).not.toBeNull();
    expect(entry.id).toBeDefined();
  });

  it("logs activity with metadata", async () => {
    assertTestUser(TEST_CEO_ID);
    const entry = await logActivity(
      TEST_CEO_ID,
      "updated",
      "client",
      TEST_ORG_ID,
      TEST_ORG_ID,
      "Test: updated client profile",
      { field: "notes", oldValue: "old", newValue: "new" },
    );
    expect(entry).not.toBeNull();
  });

  it("lists activity log entries", async () => {
    const result = await listActivityLog();
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("action");
    expect(result.data[0]).toHaveProperty("entityType");
    expect(result.data[0]).toHaveProperty("userName");
    expect(result.data[0]).toHaveProperty("description");
  });

  it("filters by entity type", async () => {
    const result = await listActivityLog({ entityType: "note" });
    for (const entry of result.data) {
      expect(entry.entityType).toBe("note");
    }
  });

  it("filters by user", async () => {
    const result = await listActivityLog({ userId: TEST_CEO_ID });
    for (const entry of result.data) {
      expect(entry.userId).toBe(TEST_CEO_ID);
    }
  });

  it("supports pagination", async () => {
    const result = await listActivityLog({ page: 1, limit: 1 });
    expect(result.limit).toBe(1);
    expect(result.data.length).toBeLessThanOrEqual(1);
  });
});

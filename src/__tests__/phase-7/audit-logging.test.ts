// Phase 7: Audit logging verification
// Verifies: logActivity writes correct fields, listActivityLog filters work
// See: docs/testing-plan.md § Phase 7, R29-R31

import { describe, it, expect } from "vitest";
import { logActivity, listActivityLog } from "@/lib/db/queries/activity-log";
import { TEST_CEO_ID, TEST_ORG_ID } from "../test-constants";
import { assertTestUser, assertTestOrg } from "../guards";
import * as fs from "fs";

describe("Audit Logging (R29-R31)", () => {
  it("logActivity writes all required fields (R31)", async () => {
    assertTestUser(TEST_CEO_ID);
    assertTestOrg(TEST_ORG_ID);

    const entry = await logActivity(
      TEST_CEO_ID,
      "created",
      "note",
      null,
      TEST_ORG_ID,
      "Phase 7 audit test",
      { test: true },
    );
    expect(entry).not.toBeNull();
    expect(entry.id).toBeDefined();
    expect(entry.created_at).toBeDefined();
  });

  it("listActivityLog returns entries with user info", async () => {
    const result = await listActivityLog({ userId: TEST_CEO_ID, limit: 5 });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("userName");
    expect(result.data[0]).toHaveProperty("action");
    expect(result.data[0]).toHaveProperty("entityType");
  });

  it("read-only routes do NOT have logActivity calls (R30)", () => {
    // Verify GET-only route files don't import logActivity
    const readOnlyRoutes = [
      "src/app/api/dashboard/route.ts",
      "src/app/api/clients/route.ts",
      "src/app/api/tickets/route.ts",
      "src/app/api/tickets/stats/route.ts",
      "src/app/api/projects/route.ts",
      "src/app/api/projects/stats/route.ts",
      "src/app/api/team/route.ts",
      "src/app/api/notifications/route.ts",
      "src/app/api/notifications/unread-count/route.ts",
      "src/app/api/connectors/route.ts",
      "src/app/api/ai/conversations/route.ts",
    ];

    for (const route of readOnlyRoutes) {
      const content = fs.readFileSync(route, "utf-8");
      expect(content).not.toContain("logActivity");
    }
  });

  it("mutation routes DO have logActivity calls (R29)", () => {
    const mutationRoutes = [
      "src/app/api/clients/[id]/route.ts",
      "src/app/api/tickets/[id]/notes/route.ts",
      "src/app/api/team/[id]/route.ts",
      "src/app/api/contact-submissions/[id]/route.ts",
      "src/app/api/projects/[id]/tasks/route.ts",
      "src/app/api/projects/[id]/tasks/[taskId]/route.ts",
    ];

    for (const route of mutationRoutes) {
      const content = fs.readFileSync(route, "utf-8");
      expect(content).toContain("logActivity");
    }
  });
});

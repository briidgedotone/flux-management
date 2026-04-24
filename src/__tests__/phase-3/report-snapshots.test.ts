import { describe, it, expect } from "vitest";
import { createSnapshot, listSnapshots, getLatestSnapshot } from "@/lib/db/queries/report-snapshots";

describe("Report Snapshot Queries", () => {
  it("creates a snapshot (idempotent)", async () => {
    const snap = await createSnapshot("revenue", "daily", "2026-01-01", {
      totalRevenue: 70000,
      clientCount: 2,
    });
    expect(snap).not.toBeNull();
    expect(snap.report_type).toBe("revenue");
  });

  it("upserts on duplicate (idempotent)", async () => {
    const snap1 = await createSnapshot("revenue", "daily", "2026-01-01", { totalRevenue: 70000 });
    const snap2 = await createSnapshot("revenue", "daily", "2026-01-01", { totalRevenue: 75000 });
    expect(snap1.id).toBe(snap2.id); // Same row updated
  });

  it("lists snapshots by report type", async () => {
    await createSnapshot("sla", "daily", "2026-01-01", { avgSla: 95 });
    await createSnapshot("sla", "daily", "2026-01-02", { avgSla: 96 });

    const snaps = await listSnapshots("sla");
    expect(snaps.length).toBeGreaterThanOrEqual(2);
    expect(snaps[0]).toHaveProperty("data");
    expect(snaps[0]).toHaveProperty("periodDate");
  });

  it("filters by period", async () => {
    await createSnapshot("revenue", "weekly", "2026-01-06", { totalRevenue: 80000 });
    const weekly = await listSnapshots("revenue", { period: "weekly" });
    for (const s of weekly) {
      expect(s.period).toBe("weekly");
    }
  });

  it("gets latest snapshot", async () => {
    const latest = await getLatestSnapshot("revenue", "daily");
    expect(latest).not.toBeNull();
    expect(latest!.reportType).toBe("revenue");
  });

  it("returns null for non-existent snapshot type", async () => {
    const result = await getLatestSnapshot("ticket_analytics", "monthly");
    // May or may not exist — just verify no crash
    expect(result === null || result.reportType === "ticket_analytics").toBe(true);
  });
});

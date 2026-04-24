// Report snapshot query module — historical report data for trends
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

type ReportType = "revenue" | "team_performance" | "sla" | "ticket_analytics";
type Period = "daily" | "weekly" | "monthly";

/** Save a point-in-time report snapshot. Uses ON CONFLICT for idempotency. */
export async function createSnapshot(
  reportType: ReportType,
  period: Period,
  periodDate: string,
  data: Record<string, unknown>,
) {
  const result = await query(
    `INSERT INTO report_snapshots (report_type, period, period_date, data)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (report_type, period, period_date)
     DO UPDATE SET data = $4, created_at = now()
     RETURNING id, report_type, period, period_date, created_at`,
    [reportType, period, periodDate, JSON.stringify(data)],
  );
  return result.rows[0] ?? null;
}

/** List snapshots for a report type, ordered by date descending. */
export async function listSnapshots(
  reportType: ReportType,
  filters: { period?: Period; limit?: number } = {},
) {
  const { period, limit = 30 } = filters;

  const conditions: string[] = ["report_type = $1"];
  const params: unknown[] = [reportType];
  let idx = 2;

  if (period) {
    conditions.push(`period = $${idx++}`);
    params.push(period);
  }

  params.push(limit);
  const result = await query(
    `SELECT id, report_type, period, period_date, data, created_at
     FROM report_snapshots
     WHERE ${conditions.join(" AND ")}
     ORDER BY period_date DESC
     LIMIT $${idx}`,
    params,
  );

  return result.rows.map((r) => ({
    id: r.id,
    reportType: r.report_type,
    period: r.period,
    periodDate: r.period_date?.toISOString?.()?.split("T")[0] ?? "",
    data: r.data,
    createdAt: r.created_at?.toISOString?.() ?? "",
  }));
}

/** Get the most recent snapshot for a report type. */
export async function getLatestSnapshot(reportType: ReportType, period: Period = "daily") {
  const result = await query(
    `SELECT id, report_type, period, period_date, data, created_at
     FROM report_snapshots
     WHERE report_type = $1 AND period = $2
     ORDER BY period_date DESC
     LIMIT 1`,
    [reportType, period],
  );

  if (!result.rows[0]) return null;
  const r = result.rows[0];
  return {
    id: r.id,
    reportType: r.report_type,
    period: r.period,
    periodDate: r.period_date?.toISOString?.()?.split("T")[0] ?? "",
    data: r.data,
    createdAt: r.created_at?.toISOString?.() ?? "",
  };
}

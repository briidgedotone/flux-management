// Tech stack query module — software subscriptions, infrastructure, cloud services
// PRD M5: "Display of detailed tech stack information for each client"
// R11: Cross-org aggregations MUST include WHERE o.is_active = true
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

/** List all software subscriptions across active clients. */
export async function listSoftwareSubscriptions(clientId?: string) {
  const conditions: string[] = ["o.is_active = true"];
  const params: unknown[] = [];
  let idx = 1;

  if (clientId) {
    conditions.push(`s.organization_id = $${idx++}`);
    params.push(clientId);
  }

  const result = await query(
    `SELECT s.id, s.name, s.icon_url, s.license_count, s.license_used,
       s.cost_per_month, s.billing_cycle, s.renewal_date, s.status,
       s.admin_contact, s.created_at,
       o.id AS client_id, o.name AS client_name
     FROM software_subscriptions s
     JOIN organizations o ON s.organization_id = o.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY o.name, s.name`,
    params,
  );

  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    iconUrl: r.icon_url,
    licenseCount: r.license_count,
    licenseUsed: r.license_used,
    costPerMonth: r.cost_per_month ? parseFloat(r.cost_per_month) : null,
    billingCycle: r.billing_cycle,
    renewalDate: r.renewal_date?.toISOString?.()?.split("T")[0] ?? null,
    status: r.status,
    adminContact: r.admin_contact,
    clientId: r.client_id,
    clientName: r.client_name,
  }));
}

/** List all infrastructure items across active clients. */
export async function listInfrastructureItems(clientId?: string) {
  const conditions: string[] = ["o.is_active = true"];
  const params: unknown[] = [];
  let idx = 1;

  if (clientId) {
    conditions.push(`i.organization_id = $${idx++}`);
    params.push(clientId);
  }

  const result = await query(
    `SELECT i.id, i.name, i.device_type, i.location, i.status,
       i.ip_address, i.last_seen,
       o.id AS client_id, o.name AS client_name
     FROM infrastructure_items i
     JOIN organizations o ON i.organization_id = o.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY o.name, i.name`,
    params,
  );

  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    deviceType: r.device_type,
    location: r.location,
    status: r.status,
    ipAddress: r.ip_address,
    lastSeen: r.last_seen?.toISOString?.() ?? null,
    clientId: r.client_id,
    clientName: r.client_name,
  }));
}

/** List all cloud services across active clients. */
export async function listCloudServices(clientId?: string) {
  const conditions: string[] = ["o.is_active = true"];
  const params: unknown[] = [];
  let idx = 1;

  if (clientId) {
    conditions.push(`c.organization_id = $${idx++}`);
    params.push(clientId);
  }

  const result = await query(
    `SELECT c.id, c.name, c.provider, c.tier, c.usage_percent, c.status,
       o.id AS client_id, o.name AS client_name
     FROM cloud_services c
     JOIN organizations o ON c.organization_id = o.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY o.name, c.name`,
    params,
  );

  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    provider: r.provider,
    tier: r.tier,
    usagePercent: r.usage_percent,
    status: r.status,
    clientId: r.client_id,
    clientName: r.client_name,
  }));
}

/** Get tech stack summary stats. */
export async function getTechStackStats() {
  const [software, infra, cloud] = await Promise.all([
    query(`SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE s.status = 'Active') AS active,
      COUNT(*) FILTER (WHERE s.status = 'Expiring Soon') AS expiring,
      COALESCE(SUM(s.cost_per_month), 0) AS total_cost
      FROM software_subscriptions s
      JOIN organizations o ON s.organization_id = o.id
      WHERE o.is_active = true`),
    query(`SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE i.status = 'Online') AS online,
      COUNT(*) FILTER (WHERE i.status = 'Offline') AS offline
      FROM infrastructure_items i
      JOIN organizations o ON i.organization_id = o.id
      WHERE o.is_active = true`),
    query(`SELECT COUNT(*) AS total,
      COUNT(*) FILTER (WHERE c.status = 'Active') AS active
      FROM cloud_services c
      JOIN organizations o ON c.organization_id = o.id
      WHERE o.is_active = true`),
  ]);

  return {
    software: {
      total: parseInt(software.rows[0].total, 10),
      active: parseInt(software.rows[0].active, 10),
      expiring: parseInt(software.rows[0].expiring, 10),
      totalCost: parseFloat(software.rows[0].total_cost) || 0,
    },
    infrastructure: {
      total: parseInt(infra.rows[0].total, 10),
      online: parseInt(infra.rows[0].online, 10),
      offline: parseInt(infra.rows[0].offline, 10),
    },
    cloud: {
      total: parseInt(cloud.rows[0].total, 10),
      active: parseInt(cloud.rows[0].active, 10),
    },
  };
}

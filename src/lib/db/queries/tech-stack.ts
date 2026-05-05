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
       s.admin_contact, s.source, s.created_at,
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
    source: r.source,
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
       i.ip_address, i.last_seen, i.os, i.vendor, i.model, i.memory_mb,
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
    os: r.os,
    vendor: r.vendor,
    model: r.model,
    memoryMb: r.memory_mb,
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

/** Create a software subscription. */
export async function createSoftwareSubscription(data: {
  organizationId: string;
  name: string;
  licenseCount?: number;
  costPerMonth?: number;
  billingCycle?: string;
  renewalDate?: string;
  status?: string;
  adminContact?: string;
}) {
  const result = await query(
    `INSERT INTO software_subscriptions (
       organization_id, name, license_count, cost_per_month, billing_cycle,
       renewal_date, status, admin_contact, source
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'manual')
     RETURNING id`,
    [
      data.organizationId, data.name, data.licenseCount ?? null,
      data.costPerMonth ?? null, data.billingCycle ?? null,
      data.renewalDate ?? null, data.status ?? "Active",
      data.adminContact ?? null,
    ],
  );
  return result.rows[0];
}

/** Update a software subscription. */
export async function updateSoftwareSubscription(id: string, data: {
  name?: string;
  licenseCount?: number | null;
  costPerMonth?: number | null;
  billingCycle?: string | null;
  renewalDate?: string | null;
  status?: string;
  adminContact?: string | null;
}) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.licenseCount !== undefined) { fields.push(`license_count = $${idx++}`); params.push(data.licenseCount); }
  if (data.costPerMonth !== undefined) { fields.push(`cost_per_month = $${idx++}`); params.push(data.costPerMonth); }
  if (data.billingCycle !== undefined) { fields.push(`billing_cycle = $${idx++}`); params.push(data.billingCycle); }
  if (data.renewalDate !== undefined) { fields.push(`renewal_date = $${idx++}`); params.push(data.renewalDate); }
  if (data.status !== undefined) { fields.push(`status = $${idx++}`); params.push(data.status); }
  if (data.adminContact !== undefined) { fields.push(`admin_contact = $${idx++}`); params.push(data.adminContact); }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query(
    `UPDATE software_subscriptions SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`,
    params,
  );
  return result.rows[0] ?? null;
}

/** Delete a software subscription. */
export async function deleteSoftwareSubscription(id: string) {
  const result = await query(`DELETE FROM software_subscriptions WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0] ?? null;
}

/** Create a cloud service. */
export async function createCloudService(data: {
  organizationId: string;
  name: string;
  provider?: string;
  tier?: string;
  status?: string;
}) {
  const result = await query(
    `INSERT INTO cloud_services (organization_id, name, provider, tier, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [data.organizationId, data.name, data.provider ?? null, data.tier ?? null, data.status ?? "Active"],
  );
  return result.rows[0];
}

/** Update a cloud service. */
export async function updateCloudService(id: string, data: {
  name?: string;
  provider?: string | null;
  tier?: string | null;
  status?: string;
}) {
  const fields: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); params.push(data.name); }
  if (data.provider !== undefined) { fields.push(`provider = $${idx++}`); params.push(data.provider); }
  if (data.tier !== undefined) { fields.push(`tier = $${idx++}`); params.push(data.tier); }
  if (data.status !== undefined) { fields.push(`status = $${idx++}`); params.push(data.status); }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query(
    `UPDATE cloud_services SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id`,
    params,
  );
  return result.rows[0] ?? null;
}

/** Delete a cloud service. */
export async function deleteCloudService(id: string) {
  const result = await query(`DELETE FROM cloud_services WHERE id = $1 RETURNING id`, [id]);
  return result.rows[0] ?? null;
}

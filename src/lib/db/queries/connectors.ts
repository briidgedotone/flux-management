// Connector status query module — reads shared connector_statuses table
// Management portal reads sync health; client portal sync jobs write it
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

/** List all connector statuses across active orgs. [R11: is_active=true] */
export async function listConnectorStatuses() {
  const result = await query(
    `SELECT
       cs.id, cs.connector, cs.status, cs.last_synced, cs.records_synced,
       cs.error_message, cs.updated_at,
       o.id AS client_id, o.name AS client_name
     FROM connector_statuses cs
     JOIN organizations o ON cs.organization_id = o.id
     WHERE o.is_active = true
     ORDER BY o.name ASC, cs.connector ASC`,
  );

  return result.rows.map((r) => ({
    id: r.id,
    connector: r.connector,
    status: r.status,
    lastSynced: r.last_synced?.toISOString?.() ?? null,
    recordsSynced: r.records_synced,
    errorMessage: r.error_message,
    updatedAt: r.updated_at?.toISOString?.() ?? "",
    clientId: r.client_id,
    clientName: r.client_name,
  }));
}

/** Get connector status for a specific connector name across all orgs. */
export async function getConnectorStatus(connectorName: string) {
  const result = await query(
    `SELECT
       cs.id, cs.connector, cs.status, cs.last_synced, cs.records_synced,
       cs.error_message, cs.updated_at,
       o.id AS client_id, o.name AS client_name
     FROM connector_statuses cs
     JOIN organizations o ON cs.organization_id = o.id
     WHERE cs.connector = $1 AND o.is_active = true
     ORDER BY o.name ASC`,
    [connectorName],
  );

  return result.rows.map((r) => ({
    id: r.id,
    connector: r.connector,
    status: r.status,
    lastSynced: r.last_synced?.toISOString?.() ?? null,
    recordsSynced: r.records_synced,
    errorMessage: r.error_message,
    updatedAt: r.updated_at?.toISOString?.() ?? "",
    clientId: r.client_id,
    clientName: r.client_name,
  }));
}

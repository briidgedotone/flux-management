// Document query module — reads from shared documents table (synced by client portal from SharePoint)
// PRD IN6: "Document Storage: Microsoft OneDrive"
// R11: Cross-org aggregations MUST include WHERE o.is_active = true

import { query } from "../client";

export async function listDocuments(filters: { clientId?: string; search?: string; fileType?: string } = {}) {
  const conditions: string[] = ["o.is_active = true"];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.clientId) {
    conditions.push(`d.organization_id = $${idx++}`);
    params.push(filters.clientId);
  }
  if (filters.search) {
    conditions.push(`d.name ILIKE $${idx++}`);
    params.push(`%${filters.search}%`);
  }
  if (filters.fileType) {
    conditions.push(`d.file_type = $${idx++}`);
    params.push(filters.fileType);
  }

  const result = await query(
    `SELECT d.id, d.name, d.file_type, d.folder_path, d.size_display,
       d.web_url, d.modified_at,
       o.id AS client_id, o.name AS client_name
     FROM documents d
     JOIN organizations o ON d.organization_id = o.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY d.modified_at DESC NULLS LAST
     LIMIT 200`,
    params,
  );

  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    fileType: r.file_type,
    folderPath: r.folder_path,
    sizeDisplay: r.size_display,
    webUrl: r.web_url,
    modifiedAt: r.modified_at?.toISOString?.() ?? null,
    clientId: r.client_id,
    clientName: r.client_name,
  }));
}

export async function getDocumentStats() {
  const result = await query(
    `SELECT COUNT(*) AS total,
       COUNT(DISTINCT d.organization_id) AS clients_with_docs
     FROM documents d
     JOIN organizations o ON d.organization_id = o.id
     WHERE o.is_active = true`,
  );
  return {
    total: parseInt(result.rows[0].total, 10),
    clientsWithDocs: parseInt(result.rows[0].clients_with_docs, 10),
  };
}

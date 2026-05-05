// Contact form submission query module
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

interface SubmissionFilters {
  status?: string;
  page?: number;
  limit?: number;
}

/** List contact form submissions with pagination and status filter. */
export async function listSubmissions(filters: SubmissionFilters = {}) {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM contact_form_submissions ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const dataResult = await query(
    `SELECT id, name, email, company, phone, service_interest, message,
       status, reviewed_by, created_at, updated_at
     FROM contact_form_submissions
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    phone: r.phone,
    serviceInterest: r.service_interest,
    message: r.message,
    status: r.status,
    reviewedBy: r.reviewed_by,
    createdAt: r.created_at?.toISOString?.() ?? "",
    updatedAt: r.updated_at?.toISOString?.() ?? "",
  }));

  return { data, total, page, limit };
}

/** Update submission status. Returns updated row. */
export async function updateSubmissionStatus(
  id: string,
  status: "new" | "reviewed" | "responded",
  reviewedBy: string,
) {
  const result = await query(
    `UPDATE contact_form_submissions
     SET status = $1, reviewed_by = $2, updated_at = now()
     WHERE id = $3
     RETURNING id, name, email, status, reviewed_by, updated_at`,
    [status, reviewedBy, id],
  );
  return result.rows[0] ?? null;
}

/** Create a submission from webhook. [EA §Contact Form Webhook: store raw, do not modify] */
export async function createSubmission(data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  serviceInterest?: string;
  message?: string;
}) {
  const result = await query(
    `INSERT INTO contact_form_submissions (name, email, company, phone, service_interest, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, company, status, created_at`,
    [data.name, data.email, data.company ?? null, data.phone ?? null, data.serviceInterest ?? null, data.message ?? null],
  );
  return result.rows[0] ?? null;
}

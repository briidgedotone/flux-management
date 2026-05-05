// Management notification query module
// Uses management_notifications table (not shared notifications table)
// R15: Parameterized SQL only
// R17: No SELECT *

import { query } from "../client";

interface NotificationFilters {
  type?: string;
  page?: number;
  limit?: number;
}

/** List notifications for a user. */
export async function listNotifications(userId: string, filters: NotificationFilters = {}) {
  const { type, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["user_id = $1"];
  const params: unknown[] = [userId];
  let idx = 2;

  if (type) {
    conditions.push(`type = $${idx++}`);
    params.push(type);
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM management_notifications WHERE ${whereClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const dataResult = await query(
    `SELECT id, type, title, description, link, is_read, created_at
     FROM management_notifications
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params,
  );

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    link: r.link,
    isRead: r.is_read,
    createdAt: r.created_at?.toISOString?.() ?? "",
  }));

  return { data, total, page, limit };
}

/** Get unread notification count. */
export async function getUnreadCount(userId: string) {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*) FROM management_notifications WHERE user_id = $1 AND is_read = false`,
    [userId],
  );
  return parseInt(result.rows[0].count, 10);
}

/** Mark one or all notifications as read. */
export async function markAsRead(userId: string, notificationId?: string) {
  if (notificationId) {
    await query(
      `UPDATE management_notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, userId],
    );
  } else {
    await query(
      `UPDATE management_notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
  }
}

/** Create a notification. */
export async function createNotification(
  userId: string,
  data: { type: string; title: string; description?: string; link?: string },
) {
  const result = await query(
    `INSERT INTO management_notifications (user_id, type, title, description, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, type, title, description, link, is_read, created_at`,
    [userId, data.type, data.title, data.description ?? null, data.link ?? null],
  );
  return result.rows[0] ?? null;
}

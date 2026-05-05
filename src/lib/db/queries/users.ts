// User query module — auth-only lookups (no org scoping for management portal)
// R17: No SELECT * — always specify columns
// R15: Parameterized SQL only

import { query } from "../client";

interface UserRow {
  id: string;
  organization_id: string | null;
  azure_ad_oid: string | null;
  email: string;
  name: string;
  initials: string | null;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  last_login: Date | null;
  notification_prefs: Record<string, boolean>;
  created_at: Date;
  updated_at: Date;
}

const USER_COLUMNS = `id, organization_id, azure_ad_oid, email, name, initials,
  role, avatar_url, phone, is_active, last_login, notification_prefs,
  created_at, updated_at`;

/** Auth-only: find user by Azure AD OID during OAuth callback. */
export async function getUserByAzureOid(oid: string) {
  const { rows } = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE azure_ad_oid = $1 AND is_active = true`,
    [oid],
  );
  return rows[0] ?? null;
}

/** Auth-only: find user by ID during session verification. */
export async function getUserById(id: string) {
  const { rows } = await query<UserRow>(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND is_active = true`,
    [id],
  );
  return rows[0] ?? null;
}

/** Update last_login timestamp on successful authentication. */
export async function updateUserLastLogin(userId: string) {
  await query(
    `UPDATE users SET last_login = now(), updated_at = now() WHERE id = $1`,
    [userId],
  );
}

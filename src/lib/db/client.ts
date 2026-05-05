// PostgreSQL connection pool — NO RLS scoping (management portal is cross-org)
// Ref: BP §4 (Database Connection), SO §2 (Data Access Model)

import { Pool, PoolClient, QueryResultRow } from "pg";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required in production");
}

const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  ssl: isProduction ? { rejectUnauthorized: true } : undefined,
});

pool.on("error", (err) => {
  console.error("[db] idle client error:", err.message);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

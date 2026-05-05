// Database migration runner — uses same _migrations tracking table as client portal
// Ref: BP §4 (Database Schema), Flux-client/src/lib/db/migrate.ts (pattern)
// Uses DATABASE_ADMIN_URL for DDL privileges, falls back to DATABASE_URL

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_ADMIN_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[migrate] DATABASE_ADMIN_URL or DATABASE_URL is not set");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const migrationsDir = join(__dirname, "migrations");

async function run() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Same tracking table as client portal
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const { rows: applied } = await pool.query<{ filename: string }>(
      "SELECT filename FROM _migrations ORDER BY filename",
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log("[migrate] all migrations already applied");
      return;
    }

    console.log(`[migrate] ${pending.length} pending migration(s)`);

    for (const filename of pending) {
      if (dryRun) {
        console.log(`[migrate] (dry-run) would apply: ${filename}`);
        continue;
      }

      const sql = await readFile(join(migrationsDir, filename), "utf-8");
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO _migrations (filename) VALUES ($1)",
          [filename],
        );
        await client.query("COMMIT");
        console.log(`[migrate] applied: ${filename}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[migrate] failed: ${filename}`, (err as Error).message);
        process.exit(1);
      } finally {
        client.release();
      }
    }

    console.log("[migrate] done");
  } finally {
    await pool.end();
  }
}

run();

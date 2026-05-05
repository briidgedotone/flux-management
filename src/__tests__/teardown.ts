// Global test teardown — runs after all tests
// Clean up all test data so database is identical to before tests ran

import { Pool } from "pg";
import { cleanupTestData } from "./cleanup";

export async function teardown() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await cleanupTestData(pool);
  } finally {
    await pool.end();
  }
}

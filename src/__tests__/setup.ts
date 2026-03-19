// Global test setup — runs before all tests
// 1. Clean any leftover test data from previous run
// 2. Seed fresh test data

import { Pool } from "pg";
import { cleanupTestData } from "./cleanup";
import { seedTestData } from "./seed-test-data";

export async function setup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    await cleanupTestData(pool);
    await seedTestData(pool);
  } finally {
    await pool.end();
  }
}

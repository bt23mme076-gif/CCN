import 'dotenv/config';
import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Creating employees table...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      ALTER TABLE expenses ADD COLUMN IF NOT EXISTS employee_id TEXT REFERENCES employees(id)
    `);

    console.log('✅ Employees table created and expenses.employee_id column added!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();

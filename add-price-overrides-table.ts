import 'dotenv/config';
import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('Creating customer_price_overrides table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS customer_price_overrides (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      custom_price INTEGER NOT NULL,
      note TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(customer_id, plan_id)
    )
  `);
  console.log('✅ customer_price_overrides table created!');
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });

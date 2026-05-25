import 'dotenv/config';
import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  await db.execute(sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS speed integer NOT NULL DEFAULT 30`);
  console.log('✅ Speed column added');
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });

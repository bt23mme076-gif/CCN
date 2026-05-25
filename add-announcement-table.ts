import 'dotenv/config';
import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Creating announcements table...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Insert default announcement
    await db.execute(sql`
      INSERT INTO announcements (id, text, is_active, updated_at)
      VALUES ('announcement_main', '📺 Welcome to CCN Cable Network! Recharge your cable TV online — fast, easy, and secure.', true, NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('✅ Announcements table created and default announcement added!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();

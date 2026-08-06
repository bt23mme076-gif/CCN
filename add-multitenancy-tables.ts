import 'dotenv/config';
import { db } from './lib/db';
import { sql } from 'drizzle-orm';

// Phase 1 of multi-tenant SaaS conversion: adds an `operators` table and a
// nullable `operator_id` column to every tenant-scoped table, then backfills
// all existing rows to the 'ccn' operator (the original CCN Networks data).
// This migration is non-breaking on its own — no application code reads or
// filters by operator_id yet, so existing behavior is unchanged until the
// query-scoping work (Phase 2) ships.
const TENANT_TABLES = [
  'customers',
  'plans',
  'customer_connections',
  'recharges',
  'admins',
  'announcements',
  'customer_price_overrides',
  'customer_plan_discounts',
  'accessories',
  'advertisements',
  'channels',
  'accessory_orders',
  'push_subscriptions',
  'retrack_requests',
  'admin_push_subscriptions',
  'employees',
  'expenses',
];

async function migrate() {
  console.log('Setting up multi-tenancy foundation...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS operators (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subdomain TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        whatsapp_number TEXT,
        cashfree_app_id TEXT,
        cashfree_secret_key TEXT,
        cashfree_env TEXT NOT NULL DEFAULT 'sandbox',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✅ operators table ready');

    await db.execute(sql`
      INSERT INTO operators (id, name, subdomain, is_active)
      VALUES ('ccn', 'CCN Networks', 'ccn', true)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ default "ccn" operator row ready');

    for (const table of TENANT_TABLES) {
      await db.execute(sql.raw(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS operator_id TEXT REFERENCES operators(id)`
      ));
      await db.execute(sql.raw(
        `UPDATE ${table} SET operator_id = 'ccn' WHERE operator_id IS NULL`
      ));
      console.log(`✅ ${table}: operator_id column ready, backfilled`);
    }

    console.log('\n🎉 Multi-tenancy foundation ready. All existing data tagged under operator "ccn".');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();

import { NextResponse } from 'next/server';
import { migrationClient } from '@/lib/db/index';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authCheck() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'super_admin') return null;
  return payload;
}

// Runs the pending schema migrations that normally need a server terminal
// (add-upi-reference-column, add-due-amount-paise-column,
// add-deleted-at-columns, fix-admin-username-uniqueness) — all idempotent,
// safe to run more than once. Lets a super admin apply them from the
// dashboard on serverless hosts (Vercel) where there's no shell to run
// `npm run ...` from directly.
export async function POST() {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const log: string[] = [];
  try {
    await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS upi_reference TEXT;`;
    log.push('upi_reference column: ok');

    await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS due_amount_paise INTEGER DEFAULT 0;`;
    log.push('due_amount_paise column: ok');

    await migrationClient`ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`;
    await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`;
    log.push('deleted_at columns: ok');

    await migrationClient`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_username_key;`;
    await migrationClient`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_username_unique;`;
    await migrationClient`
      CREATE UNIQUE INDEX IF NOT EXISTS admins_operator_username_idx
      ON admins (operator_id, username);
    `;
    log.push('admin username uniqueness: scoped to operator');

    const orphaned = await migrationClient`
      SELECT o.id, o.subdomain FROM operators o
      LEFT JOIN admins a ON a.operator_id = o.id
      WHERE a.id IS NULL;
    `;
    for (const row of orphaned) {
      await migrationClient`DELETE FROM operators WHERE id = ${row.id};`;
      log.push(`removed orphaned operator: ${row.subdomain}`);
    }
    if (orphaned.length === 0) log.push('no orphaned operators found');

    await migrationClient`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY DEFAULT 'global',
        payu_enabled BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;
    await migrationClient`
      INSERT INTO app_settings (id, payu_enabled) VALUES ('global', true)
      ON CONFLICT (id) DO NOTHING;
    `;
    log.push('app_settings table: ok');

    await migrationClient`ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'default';`;
    log.push('customers.payment_mode column: ok');

    await migrationClient`
      CREATE TABLE IF NOT EXISTS stream_ad_packages (
        id TEXT PRIMARY KEY,
        operator_id TEXT REFERENCES operators(id),
        ad_type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        duration_days INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;
    await migrationClient`
      CREATE TABLE IF NOT EXISTS stream_ad_bookings (
        id TEXT PRIMARY KEY,
        operator_id TEXT REFERENCES operators(id),
        package_id TEXT REFERENCES stream_ad_packages(id) ON DELETE SET NULL,
        ad_type TEXT NOT NULL,
        package_name TEXT NOT NULL,
        duration_days INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        advertiser_name TEXT NOT NULL,
        business_name TEXT,
        phone TEXT NOT NULL,
        banner_data TEXT NOT NULL,
        scroll_text TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        notes TEXT,
        admin_note TEXT,
        status TEXT NOT NULL,
        upi_reference TEXT,
        paid_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;
    await migrationClient`CREATE INDEX IF NOT EXISTS stream_ad_bookings_status_idx ON stream_ad_bookings (status);`;
    log.push('stream ad tables: ok');

    await migrationClient`
      CREATE TABLE IF NOT EXISTS recharge_pauses (
        id TEXT PRIMARY KEY,
        operator_id TEXT NOT NULL,
        mso TEXT NOT NULL,
        paused BOOLEAN NOT NULL DEFAULT false,
        message TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;
    log.push('recharge_pauses table: ok');

    await migrationClient`
      CREATE TABLE IF NOT EXISTS autopay_subscriptions (
        id TEXT PRIMARY KEY,
        operator_id TEXT REFERENCES operators(id),
        customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        connection_id TEXT REFERENCES customer_connections(id) ON DELETE CASCADE,
        plan_id TEXT REFERENCES plans(id) ON DELETE SET NULL,
        plan_name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        status TEXT NOT NULL,
        mandate_name TEXT NOT NULL,
        mandate_mobile TEXT NOT NULL,
        mandate_months INTEGER NOT NULL,
        qr_data TEXT,
        next_debit_date TIMESTAMP NOT NULL,
        last_debit_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `;
    await migrationClient`CREATE INDEX IF NOT EXISTS autopay_customer_id_idx ON autopay_subscriptions (customer_id);`;
    await migrationClient`CREATE INDEX IF NOT EXISTS autopay_status_idx ON autopay_subscriptions (status);`;
    log.push('autopay_subscriptions table: ok');

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Run migrations error:', error);
    return NextResponse.json({ error: (error as Error).message, log }, { status: 500 });
  }
}

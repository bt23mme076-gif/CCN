import type { Sql } from 'postgres';

// Tables for direct-UPI auto-verification (see lib/payments/upiAuto.ts).
// Idempotent — shared by /api/superadmin/run-migrations and add-upi-auto-verify-tables.ts.
export async function createUpiAutoVerifyTables(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS upi_payment_intents (
      id TEXT PRIMARY KEY,
      order_kind TEXT NOT NULL,
      order_id TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      pay_amount_paise INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      utr TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      matched_at TIMESTAMP
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS upi_intents_order_idx ON upi_payment_intents (order_id);`;
  // Guarantees a credited amount maps to at most one waiting order.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS upi_intents_pending_amount_idx
    ON upi_payment_intents (pay_amount_paise) WHERE status = 'pending';
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS upi_credits (
      id TEXT PRIMARY KEY,
      amount_paise INTEGER NOT NULL,
      utr TEXT,
      sender TEXT NOT NULL,
      raw TEXT NOT NULL,
      intent_id TEXT,
      received_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS upi_credits_utr_idx ON upi_credits (utr);`;
  // Matches the RLS hardening applied to the other public tables (enable-rls-public-tables.ts).
  await sql`ALTER TABLE upi_payment_intents ENABLE ROW LEVEL SECURITY;`;
  await sql`ALTER TABLE upi_credits ENABLE ROW LEVEL SECURITY;`;
}

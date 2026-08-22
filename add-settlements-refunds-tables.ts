import { migrationClient } from './lib/db/index';

async function main() {
  await migrationClient`
    CREATE TABLE IF NOT EXISTS settlements (
      id TEXT PRIMARY KEY,
      operator_id TEXT REFERENCES operators(id),
      cashfree_settlement_id TEXT,
      amount_paise INTEGER NOT NULL,
      settled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ settlements table created');

  await migrationClient`
    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      recharge_id TEXT REFERENCES recharges(id),
      operator_id TEXT REFERENCES operators(id),
      amount_paise INTEGER NOT NULL,
      cashfree_refund_id TEXT,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ refunds table created');

  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

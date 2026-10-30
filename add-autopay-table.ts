import { migrationClient } from './lib/db/index';

async function main() {
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
      qr_data TEXT,
      next_debit_date TIMESTAMP NOT NULL,
      last_debit_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `;
  await migrationClient`CREATE INDEX IF NOT EXISTS autopay_customer_id_idx ON autopay_subscriptions (customer_id);`;
  await migrationClient`CREATE INDEX IF NOT EXISTS autopay_status_idx ON autopay_subscriptions (status);`;
  console.log('✓ autopay_subscriptions table ready');
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

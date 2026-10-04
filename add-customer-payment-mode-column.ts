import { migrationClient } from './lib/db/index';

async function main() {
  await migrationClient`ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'default';`;
  console.log('✓ customers.payment_mode column ready');
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

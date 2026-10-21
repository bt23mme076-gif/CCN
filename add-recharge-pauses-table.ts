import { migrationClient } from './lib/db/index';

async function main() {
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
  console.log('✓ recharge_pauses table ready');
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

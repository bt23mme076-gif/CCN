import { migrationClient } from './lib/db/index';

async function main() {
  await migrationClient`
    CREATE TABLE IF NOT EXISTS super_admins (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ super_admins table created');
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

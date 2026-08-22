import { migrationClient } from './lib/db/index';

async function main() {
  await migrationClient`ALTER TABLE operators ADD COLUMN IF NOT EXISTS logo_url TEXT`;
  await migrationClient`ALTER TABLE operators ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#6366f1'`;
  await migrationClient`ALTER TABLE operators ADD COLUMN IF NOT EXISTS tagline TEXT`;
  await migrationClient`ALTER TABLE operators ADD COLUMN IF NOT EXISTS support_phone TEXT`;
  console.log('✓ branding columns added to operators');
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

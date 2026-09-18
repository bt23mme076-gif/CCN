import 'dotenv/config';
import { migrationClient } from './lib/db/index';

async function main() {
  console.log('Adding deleted_at columns to customers and recharges...');
  await migrationClient`ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`;
  await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`;
  console.log('✅ Done!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

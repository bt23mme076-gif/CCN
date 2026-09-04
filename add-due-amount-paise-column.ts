import 'dotenv/config';
import { migrationClient } from './lib/db/index';

async function main() {
  console.log('Adding due_amount_paise column to recharges...');
  await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS due_amount_paise INTEGER DEFAULT 0;`;
  console.log('✅ Done!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

import 'dotenv/config';
import { migrationClient } from './lib/db/index';

async function main() {
  console.log('Adding upi_reference column to recharges...');
  await migrationClient`ALTER TABLE recharges ADD COLUMN IF NOT EXISTS upi_reference TEXT;`;
  console.log('✅ Done!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

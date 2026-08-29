import 'dotenv/config';
import { migrationClient } from './lib/db/index';

async function main() {
  console.log('Adding upi_reference column to accessory_orders...');
  await migrationClient`ALTER TABLE accessory_orders ADD COLUMN IF NOT EXISTS upi_reference TEXT;`;
  console.log('✅ Done!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

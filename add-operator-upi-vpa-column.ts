import 'dotenv/config';
import { migrationClient } from './lib/db/index';

async function main() {
  console.log('Adding upi_vpa column to operators...');
  await migrationClient`ALTER TABLE operators ADD COLUMN IF NOT EXISTS upi_vpa TEXT;`;
  console.log('✅ Done!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

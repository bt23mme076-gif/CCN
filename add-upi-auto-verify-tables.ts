import 'dotenv/config';
import { migrationClient } from './lib/db/index';
import { createUpiAutoVerifyTables } from './lib/db/upiAutoVerifyMigration';

async function main() {
  console.log('Creating UPI auto-verify tables...');
  await createUpiAutoVerifyTables(migrationClient);
  console.log('✅ Done!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

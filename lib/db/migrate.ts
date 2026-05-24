import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationClient } from './index';

// Load environment variables
// Load environment variables

async function main() {
  console.log('Running migrations...');
  
  const db = drizzle(migrationClient);
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('Migrations completed!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

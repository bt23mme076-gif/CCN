import 'dotenv/config';
import { migrationClient } from './lib/db/index';

async function main() {
  console.log('Scoping admin username uniqueness to per-operator...');

  // Drop whatever the old global unique constraint/index on admins.username
  // is actually named (Postgres auto-names it admins_username_key for a
  // column-level UNIQUE), then add the composite one.
  await migrationClient`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_username_key;`;
  await migrationClient`ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_username_unique;`;
  await migrationClient`
    CREATE UNIQUE INDEX IF NOT EXISTS admins_operator_username_idx
    ON admins (operator_id, username);
  `;

  // Clean up any operator left behind by a failed operator+admin creation
  // (operator row created, admin insert then failed on the old constraint).
  const orphaned = await migrationClient`
    SELECT o.id, o.subdomain FROM operators o
    LEFT JOIN admins a ON a.operator_id = o.id
    WHERE a.id IS NULL;
  `;
  if (orphaned.length > 0) {
    console.log(`Found ${orphaned.length} orphaned operator(s) with no admin — deleting:`);
    for (const row of orphaned) {
      console.log(`  - ${row.subdomain} (${row.id})`);
      await migrationClient`DELETE FROM operators WHERE id = ${row.id};`;
    }
  }

  console.log('✅ Done!');
  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});

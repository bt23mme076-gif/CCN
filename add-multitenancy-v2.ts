import { migrationClient } from './lib/db/index';

async function main() {
  console.log('Running multi-tenancy v2 migration...');

  await migrationClient`
    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_name TEXT NOT NULL,
      subdomain TEXT NOT NULL UNIQUE,
      cashfree_vendor_id TEXT,
      commission_percent INTEGER NOT NULL DEFAULT 10,
      kyc_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓ operators table created');

  await migrationClient`
    INSERT INTO operators (id, name, business_name, subdomain, kyc_status, status)
    VALUES ('ccn', 'CCN Networks', 'CCN Networks', 'ccn', 'approved', 'active')
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('✓ CCN Networks inserted as operator #1');

  const tables: Array<{ table: string; col: string }> = [
    { table: 'customers', col: 'operator_id' },
    { table: 'plans', col: 'operator_id' },
    { table: 'admins', col: 'operator_id' },
    { table: 'recharges', col: 'operator_id' },
    { table: 'accessories', col: 'operator_id' },
    { table: 'accessory_orders', col: 'operator_id' },
    { table: 'expenses', col: 'operator_id' },
    { table: 'employees', col: 'operator_id' },
    { table: 'announcements', col: 'operator_id' },
    { table: 'advertisements', col: 'operator_id' },
    { table: 'channels', col: 'operator_id' },
  ];

  for (const { table, col } of tables) {
    await migrationClient.unsafe(`
      ALTER TABLE ${table}
      ADD COLUMN IF NOT EXISTS ${col} TEXT REFERENCES operators(id)
    `);
    await migrationClient.unsafe(`
      UPDATE ${table} SET ${col} = 'ccn' WHERE ${col} IS NULL
    `);
    console.log(`✓ ${table}.${col} added and backfilled`);
  }

  console.log('\nDone. All existing rows now belong to operator ccn.');
  await migrationClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

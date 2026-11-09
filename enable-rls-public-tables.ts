import { migrationClient } from './lib/db/index';

// Supabase exposes every table in `public` through its REST API (PostgREST) using the
// anon key. The app talks to Postgres directly as the `postgres` role, which bypasses RLS,
// so enabling RLS with no policies locks out the public API without affecting the app.
// Pass --dry-run to only list the tables that would be changed.
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const tables = await migrationClient<{ tablename: string }[]>`
    SELECT c.relname AS tablename
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relrowsecurity
  `;
  if (tables.length === 0) console.log('✓ All public tables already have RLS enabled');
  for (const { tablename } of tables) {
    if (dryRun) {
      console.log(`- RLS disabled on ${tablename}`);
      continue;
    }
    await migrationClient.unsafe(`ALTER TABLE public."${tablename}" ENABLE ROW LEVEL SECURITY`);
    console.log(`✓ RLS enabled on ${tablename}`);
  }
  await migrationClient.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

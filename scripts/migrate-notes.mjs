import postgres from 'postgres';

const sql = postgres('postgresql://postgres.rsvetmwgqhxisloklsau:123456789nitinrai22082004@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres', { ssl: 'require' });

try {
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes text`;
  console.log('notes column added');

  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id text PRIMARY KEY,
      customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      endpoint text NOT NULL,
      p256dh text NOT NULL,
      auth text NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    )
  `;
  console.log('push_subscriptions table created');

  await sql`CREATE INDEX IF NOT EXISTS push_subs_customer_id_idx ON push_subscriptions(customer_id)`;
  console.log('Migration complete!');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await sql.end();
}

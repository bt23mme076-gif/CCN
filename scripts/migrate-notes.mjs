import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

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

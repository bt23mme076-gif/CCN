import 'dotenv/config';
import { db } from './lib/db/index';
import { customers } from './lib/db/schema';
import { isNull } from 'drizzle-orm';

// Self-registered customers before this fix got operator_id = NULL and were
// invisible to every admin (the admin list filters by operator_id). This
// backfills them onto the 'ccn' operator, the only one in production today.
async function main() {
  const result = await db.update(customers).set({ operator_id: 'ccn' }).where(isNull(customers.operator_id)).returning({ id: customers.id, name: customers.name, mobile: customers.mobile });
  console.log(`✅ Backfilled ${result.length} orphan customer(s):`);
  result.forEach((c) => console.log(`  - ${c.name} (${c.mobile})`));
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed!');
  console.error(err);
  process.exit(1);
});

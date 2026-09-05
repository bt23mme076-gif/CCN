import 'dotenv/config';
import { db } from './lib/db/index';
import { customers, recharges } from './lib/db/schema';
import { isNull } from 'drizzle-orm';

// Self-registered customers before this fix got operator_id = NULL and were
// invisible to every admin (the admin list filters by operator_id). This
// backfills them onto the 'ccn' operator, the only one in production today.
// Recharges inherit operator_id from the customer at order-creation time, so
// any recharge placed while its customer was still orphaned is stuck NULL
// too (fixing the customer afterwards doesn't retroactively fix past orders)
// — backfill those directly.
async function main() {
  const result = await db.update(customers).set({ operator_id: 'ccn' }).where(isNull(customers.operator_id)).returning({ id: customers.id, name: customers.name, mobile: customers.mobile });
  console.log(`✅ Backfilled ${result.length} orphan customer(s):`);
  result.forEach((c) => console.log(`  - ${c.name} (${c.mobile})`));

  const rechargeResult = await db.update(recharges).set({ operator_id: 'ccn' }).where(isNull(recharges.operator_id)).returning({ id: recharges.id, plan_name: recharges.plan_name, status: recharges.status });
  console.log(`✅ Backfilled ${rechargeResult.length} orphan recharge(s):`);
  rechargeResult.forEach((r) => console.log(`  - ${r.id} (${r.plan_name}, ${r.status})`));
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed!');
  console.error(err);
  process.exit(1);
});

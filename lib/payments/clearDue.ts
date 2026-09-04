import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// Called once a recharge that had a due amount bundled into it is confirmed
// paid. Decrements the customer's outstanding_balance by the exact due
// portion of that payment (never below zero). Safe to call multiple times
// for the same recharge only if the caller already guarded the paid-status
// transition to happen exactly once (see the callers).
export async function clearDue(customerId: string, dueAmountPaise: number | null) {
  if (!dueAmountPaise || dueAmountPaise <= 0) return;
  const dueRupees = Math.round(dueAmountPaise / 100);
  await db
    .update(customers)
    .set({ outstanding_balance: sql`GREATEST(${customers.outstanding_balance} - ${dueRupees}, 0)` })
    .where(eq(customers.id, customerId));
}

import { db } from './db';
import { customers } from './db/schema';
import { eq, or } from 'drizzle-orm';

// Returns all customer IDs in the same group as `customerId`.
// Group = the primary account + all sub-connections pointing to it.
export async function getConnectionGroup(customerId: string): Promise<string[]> {
  const self = await db
    .select({ id: customers.id, primary_customer_id: customers.primary_customer_id })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!self.length) return [customerId];

  const primaryId = self[0].primary_customer_id ?? customerId;

  const group = await db
    .select({ id: customers.id })
    .from(customers)
    .where(or(eq(customers.id, primaryId), eq(customers.primary_customer_id, primaryId)));

  return group.map((c) => c.id);
}

// Validates that `targetId` belongs to the same group as the logged-in customer.
// Returns targetId if valid, null otherwise.
export async function validateConnectionAccess(
  loggedInCustomerId: string,
  targetId: string,
): Promise<string | null> {
  if (targetId === loggedInCustomerId) return targetId;
  const group = await getConnectionGroup(loggedInCustomerId);
  return group.includes(targetId) ? targetId : null;
}

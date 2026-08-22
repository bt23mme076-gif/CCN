import { db } from '@/lib/db';
import { operators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { cache } from 'react';

export type Operator = typeof operators.$inferSelect;

// Cached per-request: React cache() deduplicates within one render pass.
export const getOperatorBySubdomain = cache(async (subdomain: string): Promise<Operator | null> => {
  const rows = await db
    .select()
    .from(operators)
    .where(eq(operators.subdomain, subdomain))
    .limit(1);
  return rows[0] ?? null;
});

// Call this inside any server component or API route to get the current operator.
export async function getCurrentOperator(): Promise<Operator | null> {
  const h = await headers();
  const subdomain = h.get('x-operator-subdomain') ?? 'ccn';
  return getOperatorBySubdomain(subdomain);
}

// Use in API routes that must be scoped to an operator. Throws 400-friendly error if not found.
export async function requireOperator(): Promise<Operator> {
  const op = await getCurrentOperator();
  if (!op) throw new Error('Unknown operator');
  return op;
}

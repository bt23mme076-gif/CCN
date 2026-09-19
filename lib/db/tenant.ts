import { db } from '@/lib/db';
import { operators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { cache } from 'react';

export type Operator = typeof operators.$inferSelect;

// Mirrors middleware.ts's extractSubdomain — kept in sync manually since
// this file needs its own copy (see below for why).
function extractSubdomain(hostname: string): string {
  const host = hostname.split(':')[0]; // strip port
  const parts = host.split('.');
  if (parts.length <= 2) return process.env.DEFAULT_OPERATOR_SUBDOMAIN ?? 'ccn';
  return parts[0];
}

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
//
// Reads the Host header directly rather than the `x-operator-subdomain`
// header middleware.ts injects — that pattern only reliably reaches Server
// Components via next/headers, not Route Handlers, so API routes (like
// /api/operator/branding) were silently falling back to the default
// operator on every subdomain.
export async function getCurrentOperator(): Promise<Operator | null> {
  const h = await headers();
  const subdomain = extractSubdomain(h.get('host') ?? '');
  return getOperatorBySubdomain(subdomain);
}

// Use in API routes that must be scoped to an operator. Throws 400-friendly error if not found.
export async function requireOperator(): Promise<Operator> {
  const op = await getCurrentOperator();
  if (!op) throw new Error('Unknown operator');
  return op;
}

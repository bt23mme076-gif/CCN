import { db } from '@/lib/db';
import { operators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { cache } from 'react';

// Deliberately NOT `typeof operators.$inferSelect` — see the comment on
// getOperatorBySubdomain below for why this stays a fixed, explicit shape.
export interface Operator {
  id: string;
  name: string;
  business_name: string;
  subdomain: string;
  commission_percent: number;
  kyc_status: string;
  status: string;
  logo_url: string | null;
  primary_color: string | null;
  tagline: string | null;
  support_phone: string | null;
}

// Mirrors middleware.ts's extractSubdomain — kept in sync manually since
// this file needs its own copy (see below for why).
function extractSubdomain(hostname: string): string {
  const host = hostname.split(':')[0]; // strip port
  const parts = host.split('.');
  if (parts.length <= 2) return process.env.DEFAULT_OPERATOR_SUBDOMAIN ?? 'ccn';
  return parts[0];
}

// Cached per-request: React cache() deduplicates within one render pass.
//
// Selects an explicit column list rather than `select()` (all columns) on
// purpose: this runs on every single page load across the whole site
// (layout.tsx, manifest.ts, login pages included), so if it ever selects a
// column that was added to the schema but not yet migrated on the live DB,
// the entire site goes down — including the page needed to run the
// migration. That exact outage already happened once. Add new fields here
// deliberately, only after confirming the migration has run.
export const getOperatorBySubdomain = cache(async (subdomain: string): Promise<Operator | null> => {
  const rows = await db
    .select({
      id: operators.id,
      name: operators.name,
      business_name: operators.business_name,
      subdomain: operators.subdomain,
      commission_percent: operators.commission_percent,
      kyc_status: operators.kyc_status,
      status: operators.status,
      logo_url: operators.logo_url,
      primary_color: operators.primary_color,
      tagline: operators.tagline,
      support_phone: operators.support_phone,
    })
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
  // x-forwarded-host carries the original hostname on some proxy setups
  // (Vercel behind Cloudflare) where `host` gets normalized to the
  // deployment's own domain instead of the request's real one.
  const subdomain = extractSubdomain(h.get('x-forwarded-host') ?? h.get('host') ?? '');
  return getOperatorBySubdomain(subdomain);
}

// Use in API routes that must be scoped to an operator. Throws 400-friendly error if not found.
export async function requireOperator(): Promise<Operator> {
  const op = await getCurrentOperator();
  if (!op) throw new Error('Unknown operator');
  return op;
}

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, and, gte, lte, not, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminAuth();

    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const results = await db
      .select({
        rechargeId: recharges.id,
        planName: recharges.plan_name,
        amount: recharges.amount,
        expiresAt: recharges.expires_at,
        customerName: customers.name,
        customerMobile: customers.mobile,
        customerId: customers.id,
      })
      .from(recharges)
      .leftJoin(customers, eq(recharges.customer_id, customers.id))
      .where(
        and(
          eq(recharges.status, 'activated'),
          gte(recharges.expires_at, now),
          lte(recharges.expires_at, in3Days),
          not(ilike(recharges.plan_name, 'ALA CARTE%'))
        )
      )
      .orderBy(recharges.expires_at);

    return NextResponse.json({ expiring: results });
  } catch (error) {
    console.error('GET /api/admin/expiring error:', error);
    return NextResponse.json({ error: 'Failed to fetch expiring plans' }, { status: 500 });
  }
}

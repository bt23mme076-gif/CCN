import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const type = request.nextUrl.searchParams.get('type');

    if (type === 'today' || type === 'month') {
      const now = new Date();
      const start = type === 'today'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth(), 1);

      const rows = await db
        .select({ recharge: recharges, customer: customers })
        .from(recharges)
        .leftJoin(customers, eq(recharges.customer_id, customers.id))
        .where(and(eq(recharges.operator_id, admin.operatorId), sql`${recharges.status} IN ('paid', 'activated') AND ${recharges.paid_at} >= ${start.toISOString()}`))
        .orderBy(desc(recharges.paid_at))
        .limit(50);

      return NextResponse.json({ items: rows });
    }

    if (type === 'customers') {
      const rows = await db
        .select()
        .from(customers)
        .where(eq(customers.operator_id, admin.operatorId))
        .orderBy(desc(customers.created_at))
        .limit(10);

      return NextResponse.json({ items: rows });
    }

    return NextResponse.json({ error: 'Invalid detail type' }, { status: 400 });
  } catch (error) {
    console.error('Stats detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}

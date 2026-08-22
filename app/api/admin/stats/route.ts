import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await requireAdminAuth();
    const opId = admin.operatorId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartISO = monthStart.toISOString();

    const [pendingResult, todayRevenueResult, monthRevenueResult, totalRevenueResult, totalCustomersResult] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(recharges)
          .where(and(eq(recharges.operator_id, opId), eq(recharges.status, 'paid'))),

        db.select({ total: sql<number>`coalesce(sum(${recharges.amount}), 0)::int` }).from(recharges)
          .where(and(eq(recharges.operator_id, opId), sql`${recharges.status} IN ('paid', 'activated') AND ${recharges.paid_at} >= ${todayISO}`)),

        db.select({ total: sql<number>`coalesce(sum(${recharges.amount}), 0)::int` }).from(recharges)
          .where(and(eq(recharges.operator_id, opId), sql`${recharges.status} IN ('paid', 'activated') AND ${recharges.paid_at} >= ${monthStartISO}`)),

        db.select({ total: sql<number>`coalesce(sum(${recharges.amount}), 0)::int` }).from(recharges)
          .where(and(eq(recharges.operator_id, opId), sql`${recharges.status} IN ('paid', 'activated')`)),

        db.select({ count: sql<number>`count(*)::int` }).from(customers)
          .where(eq(customers.operator_id, opId)),
      ]);

    const pendingCount = pendingResult[0]?.count || 0;
    const todayRevenue = todayRevenueResult[0]?.total || 0;
    const monthRevenue = monthRevenueResult[0]?.total || 0;
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const totalCustomers = totalCustomersResult[0]?.count || 0;

    return NextResponse.json({
      pendingCount,
      todayRevenue,
      monthRevenue,
      totalRevenue,
      totalCustomers,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

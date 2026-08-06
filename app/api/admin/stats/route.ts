import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, sql, gte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminAuth();

    // Get pending count
    const pendingResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(recharges)
      .where(eq(recharges.status, 'paid'));

    const pendingCount = pendingResult[0]?.count || 0;

    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const todayRevenueResult = await db
      .select({ total: sql<number>`coalesce(sum(${recharges.amount}), 0)::int` })
      .from(recharges)
      .where(
        sql`${recharges.status} IN ('paid', 'activated') AND ${recharges.paid_at} >= ${todayISO}`
      );

    const todayRevenue = todayRevenueResult[0]?.total || 0;

    // Get current month's revenue
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStartISO = monthStart.toISOString();

    const monthRevenueResult = await db
      .select({ total: sql<number>`coalesce(sum(${recharges.amount}), 0)::int` })
      .from(recharges)
      .where(
        sql`${recharges.status} IN ('paid', 'activated') AND ${recharges.paid_at} >= ${monthStartISO}`
      );

    const monthRevenue = monthRevenueResult[0]?.total || 0;

    // Get total revenue
    const totalRevenueResult = await db
      .select({ total: sql<number>`coalesce(sum(${recharges.amount}), 0)::int` })
      .from(recharges)
      .where(sql`${recharges.status} IN ('paid', 'activated')`);

    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Get total customers
    const totalCustomersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers);

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

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdminAuth();

    const now = new Date();

    // --- This month ---
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    const [thisMonthRes, lastMonthRes, todayRes, totalAllRes] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(${recharges.amount}),0)::int`, count: sql<number>`count(*)::int` })
        .from(recharges)
        .where(sql`${recharges.status} IN ('paid','activated') AND ${recharges.paid_at} >= ${thisMonthStart.toISOString()}`),

      db.select({ total: sql<number>`coalesce(sum(${recharges.amount}),0)::int` })
        .from(recharges)
        .where(sql`${recharges.status} IN ('paid','activated') AND ${recharges.paid_at} >= ${lastMonthStart.toISOString()} AND ${recharges.paid_at} <= ${lastMonthEnd.toISOString()}`),

      db.select({ total: sql<number>`coalesce(sum(${recharges.amount}),0)::int`, count: sql<number>`count(*)::int` })
        .from(recharges)
        .where(sql`${recharges.status} IN ('paid','activated') AND ${recharges.paid_at} >= ${todayStart.toISOString()}`),

      db.select({ total: sql<number>`coalesce(sum(${recharges.amount}),0)::int`, count: sql<number>`count(*)::int` })
        .from(recharges)
        .where(sql`${recharges.status} IN ('paid','activated')`),
    ]);

    const thisMonth = thisMonthRes[0] ?? { total: 0, count: 0 };
    const lastMonth = lastMonthRes[0] ?? { total: 0 };
    const today = todayRes[0] ?? { total: 0, count: 0 };
    const totalAll = totalAllRes[0] ?? { total: 0, count: 0 };

    // --- Last 30 days daily ---
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyRaw = await db
      .select({
        day: sql<string>`DATE(${recharges.paid_at} AT TIME ZONE 'Asia/Kolkata')`,
        total: sql<number>`coalesce(sum(${recharges.amount}),0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(recharges)
      .where(sql`${recharges.status} IN ('paid','activated') AND ${recharges.paid_at} >= ${thirtyDaysAgo.toISOString()}`)
      .groupBy(sql`DATE(${recharges.paid_at} AT TIME ZONE 'Asia/Kolkata')`)
      .orderBy(sql`DATE(${recharges.paid_at} AT TIME ZONE 'Asia/Kolkata')`);

    // Fill missing days with 0
    const dailyMap: Record<string, { total: number; count: number }> = {};
    dailyRaw.forEach((r) => { dailyMap[r.day] = { total: r.total, count: r.count }; });
    const daily: { day: string; total: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      daily.push({ day: key, total: dailyMap[key]?.total || 0, count: dailyMap[key]?.count || 0 });
    }

    // --- Last 6 months monthly ---
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyRaw = await db
      .select({
        month: sql<string>`TO_CHAR(${recharges.paid_at} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${recharges.amount}),0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(recharges)
      .where(sql`${recharges.status} IN ('paid','activated') AND ${recharges.paid_at} >= ${sixMonthsAgo.toISOString()}`)
      .groupBy(sql`TO_CHAR(${recharges.paid_at} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${recharges.paid_at} AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')`);

    // Fill missing months
    const monthMap: Record<string, { total: number; count: number }> = {};
    monthlyRaw.forEach((r) => { monthMap[r.month] = { total: r.total, count: r.count }; });
    const monthly: { month: string; label: string; total: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      monthly.push({ month: key, label, total: monthMap[key]?.total || 0, count: monthMap[key]?.count || 0 });
    }

    // --- Top 5 plans ---
    const topPlans = await db
      .select({
        planName: recharges.plan_name,
        total: sql<number>`coalesce(sum(${recharges.amount}),0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(recharges)
      .where(sql`${recharges.status} IN ('paid','activated')`)
      .groupBy(recharges.plan_name)
      .orderBy(sql`sum(${recharges.amount}) DESC`)
      .limit(5);

    return NextResponse.json({
      summary: {
        today: today.total, todayCount: today.count,
        thisMonth: thisMonth.total, thisMonthCount: thisMonth.count,
        lastMonth: lastMonth.total,
        totalRevenue: totalAll.total, totalCount: totalAll.count,
      },
      daily,
      monthly,
      topPlans,
    });
  } catch (error) {
    console.error('GET /api/admin/revenue error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, desc, or, ilike, inArray, and, isNull, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');

    let query = db
      .select({
        recharge: recharges,
        customer: customers,
      })
      .from(recharges)
      .leftJoin(customers, eq(recharges.customer_id, customers.id))
      .where(and(eq(recharges.operator_id, admin.operatorId), isNull(recharges.deleted_at)))
      .orderBy(desc(recharges.created_at))
      .$dynamic();

    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      query = query.where(and(eq(recharges.operator_id, admin.operatorId), isNull(recharges.deleted_at), statuses.length === 1 ? eq(recharges.status, statuses[0]) : inArray(recharges.status, statuses)));
    }

    if (search) {
      query = query.where(
        and(
          eq(recharges.operator_id, admin.operatorId),
          isNull(recharges.deleted_at),
          or(
            ilike(customers.name, `%${search}%`),
            ilike(customers.mobile, `%${search}%`)
          )
        )
      );
    }

    if (limit) {
      const n = parseInt(limit, 10);
      if (n > 0) query = query.limit(n);
    }

    const results = await query;

    // For orders still awaiting activation, attach the customer's currently
    // running base plan (same connection). Activating such an order chains it
    // after that plan's expiry, so the admin UI can say so instead of leaving
    // an early renewal sitting in "pending".
    const awaiting = results.filter((r) => r.recharge.status === 'paid' || r.recharge.status === 'pending');
    const currentPlanByKey = new Map<string, { name: string; expires_at: Date }>();
    if (awaiting.length > 0) {
      const customerIds = [...new Set(awaiting.map((r) => r.recharge.customer_id))];
      const active = await db
        .select({
          customer_id: recharges.customer_id,
          connection_id: recharges.connection_id,
          plan_name: recharges.plan_name,
          expires_at: recharges.expires_at,
        })
        .from(recharges)
        .where(and(
          eq(recharges.operator_id, admin.operatorId),
          inArray(recharges.customer_id, customerIds),
          eq(recharges.status, 'activated'),
          isNull(recharges.deleted_at),
          gt(recharges.expires_at, new Date()),
        ));
      for (const a of active) {
        if (!a.expires_at || a.plan_name.toUpperCase().startsWith('ALA CARTE')) continue;
        const key = `${a.customer_id}|${a.connection_id ?? ''}`;
        const prev = currentPlanByKey.get(key);
        if (!prev || a.expires_at > prev.expires_at) currentPlanByKey.set(key, { name: a.plan_name, expires_at: a.expires_at });
      }
    }

    const withCurrentPlan = results.map((r) => ({
      ...r,
      currentPlan: (r.recharge.status === 'paid' || r.recharge.status === 'pending')
        ? currentPlanByKey.get(`${r.recharge.customer_id}|${r.recharge.connection_id ?? ''}`) ?? null
        : null,
    }));

    return NextResponse.json({ recharges: withCurrentPlan });
  } catch (error) {
    console.error('Get admin recharges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recharges' },
      { status: 500 }
    );
  }
}

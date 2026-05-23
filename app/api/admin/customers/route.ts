import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, recharges } from '@/lib/db/schema';
import { eq, desc, or, ilike, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // Get all customers with recharge stats
    let query = db
      .select({
        customer: customers,
        rechargeCount: sql<number>`count(${recharges.id})::int`,
        lastRecharge: sql<string>`max(${recharges.plan_name})`,
      })
      .from(customers)
      .leftJoin(recharges, eq(customers.id, recharges.customer_id))
      .groupBy(customers.id)
      .orderBy(desc(customers.created_at))
      .$dynamic();

    // Search filter
    if (search) {
      query = query.where(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.mobile, `%${search}%`),
          ilike(customers.stb_number, `%${search}%`),
          ilike(customers.area, `%${search}%`)
        )
      );
    }

    const results = await query;

    return NextResponse.json({ customers: results });
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

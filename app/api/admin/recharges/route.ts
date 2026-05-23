import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, desc, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = db
      .select({
        recharge: recharges,
        customer: customers,
      })
      .from(recharges)
      .leftJoin(customers, eq(recharges.customer_id, customers.id))
      .orderBy(desc(recharges.created_at))
      .$dynamic();

    // Filter by status
    if (status) {
      query = query.where(eq(recharges.status, status));
    }

    // Search by customer name or mobile
    if (search) {
      query = query.where(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.mobile, `%${search}%`)
        )
      );
    }

    const results = await query;

    return NextResponse.json({ recharges: results });
  } catch (error) {
    console.error('Get admin recharges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recharges' },
      { status: 500 }
    );
  }
}

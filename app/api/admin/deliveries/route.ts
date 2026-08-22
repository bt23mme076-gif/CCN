import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessoryOrders, customers } from '@/lib/db/schema';
import { eq, desc, or, ilike, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminAuth();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = db
      .select({
        order: accessoryOrders,
        customer: customers,
      })
      .from(accessoryOrders)
      .leftJoin(customers, eq(accessoryOrders.customer_id, customers.id))
      .orderBy(desc(accessoryOrders.created_at))
      .$dynamic();

    const conditions: ReturnType<typeof eq>[] = [eq(accessoryOrders.operator_id, admin.operatorId)];

    // Filter by status (e.g. 'paid' for pending delivery, or 'delivered')
    if (status) {
      conditions.push(eq(accessoryOrders.status, status));
    } else {
      conditions.push(
        or(
          eq(accessoryOrders.status, 'paid'),
          eq(accessoryOrders.status, 'delivered')
        )!
      );
    }

    // Search by customer name or mobile
    if (search) {
      conditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.mobile, `%${search}%`)
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    return NextResponse.json(
      { orders: results },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Get admin deliveries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}


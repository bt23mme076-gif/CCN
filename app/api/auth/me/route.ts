import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { resolveConnection } from '@/lib/connections';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await db
      .select({
        id: customers.id,
        name: customers.name,
        mobile: customers.mobile,
        stb_number: customers.stb_number,
        area: customers.area,
        outstanding_balance: customers.outstanding_balance,
        fast_recharge_enabled: customers.fast_recharge_enabled,
        fast_recharge_amount: customers.fast_recharge_amount,
        created_at: customers.created_at,
      })
      .from(customers)
      .where(eq(customers.id, user.customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const cid = request.nextUrl.searchParams.get('cid');
    let result = { ...customer[0] };

    // If a specific connection is requested, override stb_number and area
    if (cid && cid !== 'primary') {
      const conn = await resolveConnection(user.customerId, cid);
      if (conn) {
        result = { ...result, stb_number: conn.stb_number, area: conn.area };
      }
    }

    return NextResponse.json({ customer: result });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
  }
}

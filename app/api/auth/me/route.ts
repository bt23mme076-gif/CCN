import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateConnectionAccess } from '@/lib/connections';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cid = request.nextUrl.searchParams.get('cid');
    let targetId = user.customerId;

    if (cid && cid !== user.customerId) {
      const valid = await validateConnectionAccess(user.customerId, cid);
      if (!valid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      targetId = valid;
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
        primary_customer_id: customers.primary_customer_id,
        created_at: customers.created_at,
      })
      .from(customers)
      .where(eq(customers.id, targetId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer: customer[0] });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    );
  }
}

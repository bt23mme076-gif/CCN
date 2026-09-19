import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { resolveConnection } from '@/lib/connections';
import { buildUpiLink } from '@/lib/payments/upi';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();

    let requestedConnectionId: string | undefined;
    try {
      const body = await request.json();
      requestedConnectionId = body?.connectionId;
    } catch { /* no body */ }

    const connInfo = await resolveConnection(user.customerId, requestedConnectionId);
    if (!connInfo) return NextResponse.json({ error: 'Invalid connection' }, { status: 400 });
    const resolvedConnectionId = connInfo.connectionId;

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, user.customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const c = customer[0];

    if (!c.fast_recharge_enabled || !c.fast_recharge_amount) {
      return NextResponse.json({ error: 'Fast Recharge not enabled for this account' }, { status: 403 });
    }

    if (c.outstanding_balance > 0) {
      return NextResponse.json(
        { error: `Recharge blocked. Please clear your outstanding due of ₹${c.outstanding_balance} first.` },
        { status: 403 }
      );
    }

    const rechargeId = generateOrderId();

    await db.insert(recharges).values({
      id: rechargeId,
      operator_id: c.operator_id,
      customer_id: user.customerId,
      connection_id: resolvedConnectionId,
      plan_id: null,
      plan_name: 'Fast Recharge',
      amount: c.fast_recharge_amount,
      status: 'pending',
    });

    const upiLink = buildUpiLink(c.fast_recharge_amount, `${c.name} - Fast Recharge`);

    return NextResponse.json({ orderId: rechargeId, upiLink, amount: c.fast_recharge_amount });
  } catch (error) {
    console.error('UPI order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

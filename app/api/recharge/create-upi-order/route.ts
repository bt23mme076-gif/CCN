import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers, operators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { resolveConnection } from '@/lib/connections';
import { createCashfreeOrder } from '@/lib/payments/cashfreeOrder';
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

    const operator = c.operator_id
      ? await db.select().from(operators).where(eq(operators.id, c.operator_id)).limit(1).then(r => r[0] ?? null)
      : null;

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

    let paymentSessionId: string | null = null;
    try {
      const cfResult = await createCashfreeOrder({
        orderId: rechargeId,
        amountPaise: c.fast_recharge_amount,
        customerId: user.customerId,
        customerPhone: '+91' + c.mobile,
        customerName: c.name,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?order_id=${rechargeId}&type=fast`,
        operator,
      });
      paymentSessionId = cfResult.paymentSessionId;
    } catch { /* fallback to direct UPI link */ }

    return NextResponse.json({ orderId: rechargeId, upiLink, amount: c.fast_recharge_amount, paymentSessionId });
  } catch (error) {
    console.error('UPI order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

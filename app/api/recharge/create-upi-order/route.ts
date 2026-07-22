import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { resolveConnection } from '@/lib/connections';

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
    const amountInRupees = (c.fast_recharge_amount / 100).toFixed(2);

    await db.insert(recharges).values({
      id: rechargeId,
      customer_id: user.customerId,
      connection_id: resolvedConnectionId,
      plan_id: null,
      plan_name: 'Fast Recharge',
      amount: c.fast_recharge_amount,
      status: 'pending',
    });

    const upiParams = `pa=9399974696-4@ibl&pn=CCN%20Networks&am=${amountInRupees}&cu=INR&tn=CCN%20Fast%20Recharge`;
    const upiLink = `upi://pay?${upiParams}`;
    const intentLink = `intent://pay?${upiParams}#Intent;scheme=upi;end`;

    // Create Cashfree order for upiApp component
    let paymentSessionId: string | null = null;
    if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
      try {
        const cashfreeApiUrl = process.env.CASHFREE_ENV === 'production'
          ? 'https://api.cashfree.com/pg/orders'
          : 'https://sandbox.cashfree.com/pg/orders';

        const cfRes = await fetch(cashfreeApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': process.env.CASHFREE_APP_ID,
            'x-client-secret': process.env.CASHFREE_SECRET_KEY,
            'x-api-version': '2023-08-01',
          },
          body: JSON.stringify({
            order_id: rechargeId,
            order_amount: amountInRupees,
            order_currency: 'INR',
            customer_details: {
              customer_id: user.customerId,
              customer_phone: c.mobile,
              customer_name: c.name,
            },
            order_meta: {
              return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?order_id=${rechargeId}`,
            },
          }),
        });
        if (cfRes.ok) {
          const cfData = await cfRes.json();
          paymentSessionId = cfData.payment_session_id || null;
        }
      } catch { /* fallback to direct UPI */ }
    }

    return NextResponse.json({ orderId: rechargeId, upiLink, intentLink, amount: c.fast_recharge_amount, paymentSessionId });
  } catch (error) {
    console.error('UPI order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

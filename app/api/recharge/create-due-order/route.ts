import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';

export async function POST(_request: NextRequest) {
  try {
    const user = await requireCustomerAuth();

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, user.customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const c = customer[0];

    if (!c.outstanding_balance || c.outstanding_balance <= 0) {
      return NextResponse.json({ error: 'No outstanding balance' }, { status: 400 });
    }

    const orderId = generateOrderId();
    const amountInRupees = (c.outstanding_balance / 100).toFixed(2);

    await db.insert(recharges).values({
      id: orderId,
      customer_id: user.customerId,
      connection_id: null,
      plan_id: null,
      plan_name: 'Due Payment',
      amount: c.outstanding_balance,
      status: 'pending',
    });

    let paymentSessionId: string | null = null;
    let upiLink = '';

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
            order_id: orderId,
            order_amount: amountInRupees,
            order_currency: 'INR',
            customer_details: {
              customer_id: user.customerId,
              customer_phone: '+91' + c.mobile,
              customer_name: c.name,
            },
            order_meta: {
              return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?order_id=${orderId}&type=due`,
            },
          }),
        });
        if (cfRes.ok) {
          const cfData = await cfRes.json();
          paymentSessionId = cfData.payment_session_id || null;
        }
      } catch { /* fallback */ }
    }

    const upiParams = `pa=9399974696-4@ibl&pn=CCN%20Networks&am=${amountInRupees}&cu=INR&tn=CCN%20Due%20Payment`;
    upiLink = `upi://pay?${upiParams}`;

    return NextResponse.json({ orderId, upiLink, amount: c.outstanding_balance, paymentSessionId });
  } catch (error) {
    console.error('Due order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

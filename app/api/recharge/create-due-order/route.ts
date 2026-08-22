import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers, operators } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { createCashfreeOrder } from '@/lib/payments/cashfreeOrder';

export const dynamic = 'force-dynamic';

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

    const operator = c.operator_id
      ? await db.select().from(operators).where(eq(operators.id, c.operator_id)).limit(1).then(r => r[0] ?? null)
      : null;

    const orderId = generateOrderId();
    const amountInPaise = c.outstanding_balance * 100;
    const amountInRupees = c.outstanding_balance.toFixed(2);

    await db.insert(recharges).values({
      id: orderId,
      operator_id: c.operator_id,
      customer_id: user.customerId,
      connection_id: null,
      plan_id: null,
      plan_name: 'Due Payment',
      amount: amountInPaise,
      status: 'pending',
    });

    let paymentSessionId: string | null = null;
    try {
      const cfResult = await createCashfreeOrder({
        orderId,
        amountPaise: amountInPaise,
        customerId: user.customerId,
        customerPhone: '+91' + c.mobile,
        customerName: c.name,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?order_id=${orderId}&type=due`,
        operator,
      });
      paymentSessionId = cfResult.paymentSessionId;
    } catch { /* fallback to UPI link */ }

    const upiParams = `pa=9399974696-4@ibl&pn=CCN%20Networks&am=${amountInRupees}&cu=INR&tn=CCN%20Due%20Payment`;
    const upiLink = `upi://pay?${upiParams}`;

    return NextResponse.json({ orderId, upiLink, amount: amountInPaise, paymentSessionId });
  } catch (error) {
    console.error('Due order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

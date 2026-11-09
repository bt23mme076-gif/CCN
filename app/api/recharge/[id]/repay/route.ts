import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, recharges } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { createUpiPayment } from '@/lib/payments/upiAuto';
import { buildPayuTxnParams, isPayuEnabled } from '@/lib/payments/payu';

export const dynamic = 'force-dynamic';

// Payment details for a recharge the admin marked "payment not received". The
// row stays 'payment_due' until the money is actually confirmed (submit-utr /
// PayU settle), so abandoning this leaves the customer's banner in place.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCustomerAuth();
    const id = (await params).id;

    const [recharge] = await db.select().from(recharges)
      .where(and(eq(recharges.id, id), eq(recharges.customer_id, user.customerId)))
      .limit(1);
    if (!recharge) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (recharge.status !== 'payment_due') return NextResponse.json({ error: 'This payment is already complete' }, { status: 409 });

    const [customer] = await db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1);
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const origin = request.nextUrl.origin;
    const payu = await isPayuEnabled(user.customerId)
      ? buildPayuTxnParams({
          txnid: recharge.id,
          amountPaise: recharge.amount,
          productinfo: recharge.plan_name,
          firstname: customer.name,
          email: `${customer.mobile}@ccn.atyant.in`,
          phone: customer.mobile,
          udf1: 'recharges',
          surl: `${origin}/api/payu/callback`,
          furl: `${origin}/api/payu/callback`,
        })
      : null;

    const { upiLink } = await createUpiPayment({
      kind: 'recharge',
      orderId: recharge.id,
      amountPaise: recharge.amount,
      note: `${customer.name} - ${recharge.plan_name}`,
    });

    return NextResponse.json({
      orderId: recharge.id,
      upiLink,
      amount: recharge.amount,
      payu,
    });
  } catch (error) {
    console.error('Repay error:', error);
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 500 });
  }
}

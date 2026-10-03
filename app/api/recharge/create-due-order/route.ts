import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { buildUpiLink } from '@/lib/payments/upi';
import { buildPayuTxnParams, isPayuEnabled } from '@/lib/payments/payu';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    const amountInPaise = c.outstanding_balance * 100;

    await db.insert(recharges).values({
      id: orderId,
      operator_id: c.operator_id,
      customer_id: user.customerId,
      connection_id: null,
      plan_id: null,
      plan_name: 'Due Payment',
      amount: amountInPaise,
      due_amount_paise: amountInPaise,
      status: 'pending',
    });

    const upiLink = buildUpiLink(amountInPaise, `${c.name} - Due Payment`);

    const origin = request.nextUrl.origin;
    const payu = await isPayuEnabled()
      ? buildPayuTxnParams({
          txnid: orderId,
          amountPaise: amountInPaise,
          productinfo: 'Due Payment',
          firstname: c.name,
          email: `${c.mobile}@ccn.atyant.in`,
          phone: c.mobile,
          udf1: 'recharges',
          surl: `${origin}/api/payu/callback`,
          furl: `${origin}/api/payu/callback`,
        })
      : null;

    return NextResponse.json({ orderId, upiLink, amount: amountInPaise, payu });
  } catch (error) {
    console.error('Due order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

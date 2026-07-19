import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';

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
      plan_id: null,
      plan_name: 'Fast Recharge',
      amount: c.fast_recharge_amount,
      status: 'paid',
      paid_at: new Date(),
    });

    const upiParams = `pa=itsjatinrai@ybl&pn=CCN%20Networks&am=${amountInRupees}&cu=INR&tn=CCN%20Fast%20Recharge`;
    const upiLink = `upi://pay?${upiParams}`;
    const intentLink = `intent://pay?${upiParams}#Intent;scheme=upi;end`;

    return NextResponse.json({ orderId: rechargeId, upiLink, intentLink, amount: c.fast_recharge_amount });
  } catch (error) {
    console.error('UPI order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

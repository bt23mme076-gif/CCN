import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges, customers, customerPriceOverrides } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';

const schema = z.object({ planId: z.string() });

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const body = await request.json();
    const { planId } = schema.parse(body);

    const plan = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (plan.length === 0 || !plan[0].is_active) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    const override = await db
      .select()
      .from(customerPriceOverrides)
      .where(and(eq(customerPriceOverrides.customer_id, user.customerId), eq(customerPriceOverrides.plan_id, planId)))
      .limit(1);

    const finalPrice = override.length > 0 ? override[0].custom_price : plan[0].price;

    const customer = await db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1);
    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    if (customer[0].outstanding_balance > 0) {
      return NextResponse.json(
        { error: `Recharge blocked. Please clear your outstanding due of ₹${customer[0].outstanding_balance} first.` },
        { status: 403 }
      );
    }

    const rechargeId = generateOrderId();

    await db.insert(recharges).values({
      id: rechargeId,
      customer_id: user.customerId,
      plan_id: plan[0].id,
      plan_name: plan[0].name,
      amount: finalPrice,
      status: 'paid',
      paid_at: new Date(),
    });

    const amountInRupees = (finalPrice / 100).toFixed(2);
    const upiLink = `upi://pay?pa=itsjatinrai@ybl&pn=CCN%20Networks&am=${amountInRupees}&cu=INR&tn=CCN%20Recharge%20-%20${encodeURIComponent(plan[0].name)}`;

    return NextResponse.json({ orderId: rechargeId, upiLink, amount: finalPrice });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('UPI order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

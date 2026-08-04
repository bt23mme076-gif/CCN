import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { plans, recharges, customerPriceOverrides, customerPlanDiscounts } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';
import { calcDurationPricing, isValidMonths } from '@/lib/planDuration';
import { findCustomerByStb } from '@/lib/guestLookup';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  stbNumber: z.string().min(1),
  planId: z.string(),
  months: z.number().int().refine(isValidMonths, 'Invalid duration').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stbNumber, planId, months = 1 } = createOrderSchema.parse(body);

    const match = await findCustomerByStb(stbNumber);
    if (!match) {
      return NextResponse.json({ error: 'STB number not found. Please check and try again.' }, { status: 404 });
    }

    if (match.outstanding_balance > 0) {
      return NextResponse.json(
        { error: `Recharge blocked. This connection has an outstanding due of ₹${match.outstanding_balance}. Please log in and clear it first.` },
        { status: 403 }
      );
    }

    const plan = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (plan.length === 0 || !plan[0].is_active) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    const override = await db
      .select()
      .from(customerPriceOverrides)
      .where(and(eq(customerPriceOverrides.customer_id, match.customerId), eq(customerPriceOverrides.plan_id, planId)))
      .limit(1);

    let discountPercent = 0;
    if (months > 1) {
      const discountRow = await db
        .select()
        .from(customerPlanDiscounts)
        .where(
          and(
            eq(customerPlanDiscounts.customer_id, match.customerId),
            eq(customerPlanDiscounts.plan_id, planId),
            eq(customerPlanDiscounts.months, months)
          )
        )
        .limit(1);
      discountPercent = discountRow.length > 0 ? discountRow[0].discount_percent : 0;
    }

    const basePrice = override.length > 0 ? override[0].custom_price : plan[0].price;
    const { price: finalPrice, durationDays: finalDurationDays } = calcDurationPricing(
      basePrice,
      plan[0].duration_days,
      months,
      discountPercent
    );
    const displayPlanName = months > 1 ? `${plan[0].name} (${months} Months)` : plan[0].name;

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment gateway not configured. Please contact administrator.' }, { status: 503 });
    }

    // Clean up stale unpaid attempts for the same plan/connection
    await db
      .update(recharges)
      .set({ status: 'failed' })
      .where(
        and(
          eq(recharges.customer_id, match.customerId),
          eq(recharges.plan_id, planId),
          match.connectionId ? eq(recharges.connection_id, match.connectionId) : isNull(recharges.connection_id),
          eq(recharges.status, 'pending')
        )
      );

    const rechargeId = generateOrderId();

    const cashfreeApiUrl = process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const orderData = {
      order_id: rechargeId,
      order_amount: (finalPrice / 100).toFixed(2),
      order_currency: 'INR',
      customer_details: {
        customer_id: match.customerId,
        customer_phone: match.mobile,
        customer_name: match.name,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/recharge-status?order_id=${rechargeId}`,
      },
    };

    const cashfreeResponse = await fetch(cashfreeApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify(orderData),
    });

    const responseText = await cashfreeResponse.text();

    if (!cashfreeResponse.ok) {
      let errorData;
      try { errorData = JSON.parse(responseText); } catch { errorData = { message: responseText }; }
      console.error('Cashfree API error:', errorData);
      return NextResponse.json({ error: `Payment gateway error: ${errorData.message || 'Unknown error'}` }, { status: 503 });
    }

    const cashfreeOrder = JSON.parse(responseText);

    if (!cashfreeOrder.payment_session_id) {
      console.error('Missing payment_session_id in Cashfree response:', cashfreeOrder);
      return NextResponse.json({ error: 'Payment gateway error: Missing payment session ID' }, { status: 503 });
    }

    await db.insert(recharges).values({
      id: rechargeId,
      customer_id: match.customerId,
      connection_id: match.connectionId,
      plan_id: plan[0].id,
      plan_name: displayPlanName,
      duration_days: months > 1 ? finalDurationDays : null,
      amount: finalPrice,
      status: 'pending',
      cashfree_order_id: cashfreeOrder.order_id || rechargeId,
    });

    return NextResponse.json({
      orderId: rechargeId,
      cashfreeOrderId: cashfreeOrder.order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      amount: finalPrice,
      currency: 'INR',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Guest create order error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

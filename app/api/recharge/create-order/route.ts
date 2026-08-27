import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges, customers, customerPriceOverrides, customerPlanDiscounts, operators } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';
import { resolveConnection } from '@/lib/connections';
import { calcDurationPricing, isValidMonths } from '@/lib/planDuration';
import { createCashfreeOrder } from '@/lib/payments/cashfreeOrder';
import { buildUpiLink } from '@/lib/payments/upi';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  planId: z.string(),
  connectionId: z.string().optional(), // 'primary' or customer_connections.id
  months: z.number().int().refine(isValidMonths, 'Invalid duration').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const body = await request.json();
    const { planId, connectionId, months = 1 } = createOrderSchema.parse(body);

    const targetCustomerId = user.customerId;
    // Resolve which STB this recharge is for
    const connInfo = await resolveConnection(user.customerId, connectionId);
    if (!connInfo) return NextResponse.json({ error: 'Invalid connection' }, { status: 400 });
    const resolvedConnectionId = connInfo.connectionId; // null for primary

    // Plan, override, customer, and discount lookups are independent — run them together.
    const [plan, override, customer, discountRow] = await Promise.all([
      db.select().from(plans).where(eq(plans.id, planId)).limit(1),
      db
        .select()
        .from(customerPriceOverrides)
        .where(
          and(
            eq(customerPriceOverrides.customer_id, targetCustomerId),
            eq(customerPriceOverrides.plan_id, planId)
          )
        )
        .limit(1),
      db.select().from(customers).where(eq(customers.id, targetCustomerId)).limit(1),
      months > 1
        ? db
            .select()
            .from(customerPlanDiscounts)
            .where(
              and(
                eq(customerPlanDiscounts.customer_id, targetCustomerId),
                eq(customerPlanDiscounts.plan_id, planId),
                eq(customerPlanDiscounts.months, months)
              )
            )
            .limit(1)
        : Promise.resolve([]),
    ]);

    if (plan.length === 0 || !plan[0].is_active) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      );
    }

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const discountPercent = discountRow.length > 0 ? discountRow[0].discount_percent : 0;

    const basePrice = override.length > 0 ? override[0].custom_price : plan[0].price;
    const { price: finalPrice, durationDays: finalDurationDays } = calcDurationPricing(
      basePrice,
      plan[0].duration_days,
      months,
      discountPercent
    );
    const displayPlanName = months > 1 ? `${plan[0].name} (${months} Months)` : plan[0].name;

    if (customer[0].outstanding_balance > 0) {
      return NextResponse.json(
        { error: `Recharge blocked. Please clear your outstanding due of ₹${customer[0].outstanding_balance} first.` },
        { status: 403 }
      );
    }

    // Resolve operator for split payments
    const operator = customer[0].operator_id
      ? await db.select().from(operators).where(eq(operators.id, customer[0].operator_id)).limit(1).then(r => r[0] ?? null)
      : null;

    // Clean up stale unpaid attempts for the same plan/connection.
    await db
      .update(recharges)
      .set({ status: 'failed' })
      .where(
        and(
          eq(recharges.customer_id, targetCustomerId),
          eq(recharges.plan_id, planId),
          resolvedConnectionId ? eq(recharges.connection_id, resolvedConnectionId) : isNull(recharges.connection_id),
          eq(recharges.status, 'pending')
        )
      );

    const rechargeId = generateOrderId();

    let cfResult: { cashfreeOrderId: string; paymentSessionId: string } | null = null;
    try {
      cfResult = await createCashfreeOrder({
        orderId: rechargeId,
        amountPaise: finalPrice,
        customerId: targetCustomerId,
        customerPhone: customer[0].mobile,
        customerName: customer[0].name,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?order_id=${rechargeId}`,
        operator,
      });
    } catch { /* fallback to direct UPI link while gateway verification is pending */ }

    await db.insert(recharges).values({
      id: rechargeId,
      operator_id: customer[0].operator_id,
      customer_id: targetCustomerId,
      connection_id: resolvedConnectionId,
      plan_id: plan[0].id,
      plan_name: displayPlanName,
      duration_days: months > 1 ? finalDurationDays : null,
      amount: finalPrice,
      status: 'pending',
      cashfree_order_id: cfResult?.cashfreeOrderId ?? null,
    });

    const upiLink = buildUpiLink(finalPrice, `${customer[0].name} - ${displayPlanName}`);

    return NextResponse.json({
      orderId: rechargeId,
      cashfreeOrderId: cfResult?.cashfreeOrderId ?? null,
      paymentSessionId: cfResult?.paymentSessionId ?? null,
      upiLink,
      amount: finalPrice,
      currency: 'INR',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

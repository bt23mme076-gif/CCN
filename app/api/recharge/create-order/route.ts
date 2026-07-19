import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges, customers, customerPriceOverrides } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';

const createOrderSchema = z.object({
  planId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const body = await request.json();
    const { planId } = createOrderSchema.parse(body);

    // Get plan details
    const plan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (plan.length === 0 || !plan[0].is_active) {
      return NextResponse.json(
        { error: 'Plan not found or inactive' },
        { status: 404 }
      );
    }

    // Check if there is a customer price override for this plan
    const override = await db
      .select()
      .from(customerPriceOverrides)
      .where(
        and(
          eq(customerPriceOverrides.customer_id, user.customerId),
          eq(customerPriceOverrides.plan_id, planId)
        )
      )
      .limit(1);

    const finalPrice = override.length > 0 ? override[0].custom_price : plan[0].price;

    // Get customer details
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, user.customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (customer[0].outstanding_balance > 0) {
      return NextResponse.json(
        { error: `Recharge blocked. Please clear your outstanding due of ₹${customer[0].outstanding_balance} first.` },
        { status: 403 }
      );
    }

    // Check if Cashfree is configured
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Create recharge record first
    const rechargeId = generateOrderId();
    
    // Create Cashfree order using REST API
    const cashfreeApiUrl = process.env.CASHFREE_ENV === 'production'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const orderData = {
      order_id: rechargeId,
      order_amount: (finalPrice / 100).toFixed(2), // Convert paise to rupees
      order_currency: 'INR',
      customer_details: {
        customer_id: user.customerId,
        customer_phone: customer[0].mobile,
        customer_name: customer[0].name,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?order_id=${rechargeId}`,
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
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      console.error('Cashfree API error:', errorData);
      return NextResponse.json(
        { error: `Payment gateway error: ${errorData.message || 'Unknown error'}` },
        { status: 503 }
      );
    }

    const cashfreeOrder = JSON.parse(responseText);

    if (!cashfreeOrder.payment_session_id) {
      console.error('Missing payment_session_id in Cashfree response:', cashfreeOrder);
      return NextResponse.json(
        { error: 'Payment gateway error: Missing payment session ID' },
        { status: 503 }
      );
    }

    // Save recharge record
    await db.insert(recharges).values({
      id: rechargeId,
      customer_id: user.customerId,
      plan_id: plan[0].id,
      plan_name: plan[0].name,
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

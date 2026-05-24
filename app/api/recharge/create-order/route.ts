import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
      order_amount: (plan[0].price / 100).toFixed(2), // Convert paise to rupees
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

    if (!cashfreeResponse.ok) {
      const errorData = await cashfreeResponse.json();
      console.error('Cashfree API error:', errorData);
      throw new Error('Failed to create Cashfree order');
    }

    const cashfreeOrder = await cashfreeResponse.json();

    // Save recharge record
    await db.insert(recharges).values({
      id: rechargeId,
      customer_id: user.customerId,
      plan_id: plan[0].id,
      plan_name: plan[0].name,
      amount: plan[0].price,
      status: 'pending',
      cashfree_order_id: cashfreeOrder.order_id || rechargeId,
    });

    return NextResponse.json({
      orderId: rechargeId,
      cashfreeOrderId: cashfreeOrder.order_id,
      paymentSessionId: cashfreeOrder.payment_session_id,
      amount: plan[0].price,
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

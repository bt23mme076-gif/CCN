import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { plans, recharges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Razorpay from 'razorpay';
import { generateOrderId } from '@/lib/utils';
import { z } from 'zod';

// Initialize Razorpay only if keys are available
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

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

    // Check if Razorpay is configured
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact administrator.' },
        { status: 503 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: plan[0].price,
      currency: 'INR',
      receipt: generateOrderId(),
    });

    // Create recharge record
    const rechargeId = generateOrderId();
    await db.insert(recharges).values({
      id: rechargeId,
      customer_id: user.customerId,
      plan_id: plan[0].id,
      plan_name: plan[0].name,
      amount: plan[0].price,
      status: 'pending',
      razorpay_order_id: razorpayOrder.id,
    });

    return NextResponse.json({
      orderId: rechargeId,
      razorpayOrderId: razorpayOrder.id,
      amount: plan[0].price,
      currency: 'INR',
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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

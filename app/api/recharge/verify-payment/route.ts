import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendPushToAdmin } from '@/lib/push';

const verifyPaymentSchema = z.object({
  orderId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const body = await request.json();
    const { orderId } = verifyPaymentSchema.parse(body);

    // Check if Cashfree is configured
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 503 }
      );
    }

    // Verify payment status with Cashfree using REST API
    const cashfreeApiUrl = process.env.CASHFREE_ENV === 'production'
      ? `https://api.cashfree.com/pg/orders/${orderId}/payments`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`;

    const cashfreeResponse = await fetch(cashfreeApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    if (!cashfreeResponse.ok) {
      console.error('Cashfree API error:', cashfreeResponse.status);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payments = await cashfreeResponse.json();

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        { success: false, cancelled: true, error: 'Payment not found' },
        { status: 404 }
      );
    }

    const payment = payments[0];

    // Check payment status
    if (payment.payment_status === 'SUCCESS') {
      await db
        .update(recharges)
        .set({
          status: 'paid',
          cashfree_payment_id: payment.cf_payment_id?.toString(),
          paid_at: new Date(),
        })
        .where(eq(recharges.id, orderId));

      const recharge = await db.select().from(recharges).where(eq(recharges.id, orderId)).limit(1);
      const customer = await db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1);
      if (recharge.length > 0 && customer.length > 0) {
        const r = recharge[0];
        const c = customer[0];
        sendPushToAdmin({
          title: '💳 New Recharge — Activation Pending',
          body: `${c.name} ne ₹${(r.amount / 100).toFixed(0)} ka ${r.plan_name} plan kharida`,
          url: '/admin/pending',
        });
      }

      return NextResponse.json({ success: true });
    } else if (payment.payment_status === 'FAILED') {
      await db
        .update(recharges)
        .set({ status: 'failed' })
        .where(eq(recharges.id, orderId));

      return NextResponse.json(
        { success: false, error: 'Payment failed' },
        { status: 400 }
      );
    } else {
      const cancelled = payment.payment_status === 'USER_DROPPED' || payment.payment_status === 'PENDING';
      return NextResponse.json(
        { success: false, cancelled, error: 'Payment pending' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}

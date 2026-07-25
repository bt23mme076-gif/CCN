import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendPushToAdmin } from '@/lib/push';

export const dynamic = 'force-dynamic';

const schema = z.object({ orderId: z.string() });

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const { orderId } = schema.parse(await request.json());

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    const cashfreeApiUrl = process.env.CASHFREE_ENV === 'production'
      ? `https://api.cashfree.com/pg/orders/${orderId}/payments`
      : `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`;

    const cfRes = await fetch(cashfreeApiUrl, {
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    if (!cfRes.ok) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const payments = await cfRes.json();
    if (!payments || payments.length === 0) {
      return NextResponse.json({ success: false, cancelled: true, error: 'Payment not found' }, { status: 404 });
    }

    const payment = payments[0];

    if (payment.payment_status === 'SUCCESS') {
      await db.update(recharges).set({
        status: 'paid',
        cashfree_payment_id: payment.cf_payment_id?.toString(),
        paid_at: new Date(),
      }).where(eq(recharges.id, orderId));

      await db.update(customers).set({ outstanding_balance: 0 }).where(eq(customers.id, user.customerId));

      const customer = await db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1);
      if (customer.length > 0) {
        const c = customer[0];
        sendPushToAdmin({
          title: '✅ Due Payment Received',
          body: `${c.name} ne ₹${(payment.order_amount || 0)} ka due amount pay kar diya`,
          url: '/admin/pending',
        });
      }

      return NextResponse.json({ success: true });
    } else if (payment.payment_status === 'FAILED') {
      await db.update(recharges).set({ status: 'failed' }).where(eq(recharges.id, orderId));
      return NextResponse.json({ success: false, error: 'Payment failed' }, { status: 400 });
    } else {
      const cancelled = payment.payment_status === 'USER_DROPPED' || payment.payment_status === 'PENDING';
      return NextResponse.json({ success: false, cancelled, error: 'Payment pending' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Verify due payment error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

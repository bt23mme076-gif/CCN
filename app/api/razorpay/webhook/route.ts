import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Find recharge by razorpay_order_id
      const recharge = await db
        .select()
        .from(recharges)
        .where(eq(recharges.razorpay_order_id, orderId))
        .limit(1);

      if (recharge.length > 0 && recharge[0].status === 'pending') {
        // Update to paid
        await db
          .update(recharges)
          .set({
            status: 'paid',
            razorpay_payment_id: payment.id,
            paid_at: new Date(),
          })
          .where(eq(recharges.id, recharge[0].id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

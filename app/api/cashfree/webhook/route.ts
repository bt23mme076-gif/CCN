import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    console.log('Cashfree webhook received:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      bodyLength: body.length,
    });

    if (!signature || !timestamp) {
      console.error('Webhook missing signature or timestamp');
      return NextResponse.json({ error: 'Missing signature or timestamp' }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY!)
      .update(timestamp + body)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error('Webhook signature mismatch');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', {
      type: event.type,
      orderId: event.data?.order?.order_id,
      paymentId: event.data?.payment?.cf_payment_id,
    });

    // Handle payment success event
    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = event.data?.order?.order_id;
      const paymentId = event.data?.payment?.cf_payment_id;

      if (!orderId) {
        console.error('Webhook missing order ID');
        return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });
      }

      // Find recharge by cashfree_order_id
      const recharge = await db
        .select()
        .from(recharges)
        .where(eq(recharges.cashfree_order_id, orderId))
        .limit(1);

      console.log('Recharge found:', {
        found: recharge.length > 0,
        status: recharge[0]?.status,
      });

      if (recharge.length > 0 && recharge[0].status === 'pending') {
        // Update to paid
        await db
          .update(recharges)
          .set({
            status: 'paid',
            cashfree_payment_id: paymentId?.toString(),
            paid_at: new Date(),
          })
          .where(eq(recharges.id, recharge[0].id));

        console.log('Recharge updated to paid:', recharge[0].id);
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

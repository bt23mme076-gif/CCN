import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recharges, settlements, refunds } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateOrderId } from '@/lib/utils';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      // Cashfree test ping — no signature, just acknowledge
      return NextResponse.json({ success: true });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.CASHFREE_SECRET_KEY!)
      .update(timestamp + body)
      .digest('base64');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = event.data?.order?.order_id;
      const paymentId = event.data?.payment?.cf_payment_id;
      if (!orderId) return NextResponse.json({ error: 'Missing order ID' }, { status: 400 });

      const recharge = await db.select().from(recharges).where(eq(recharges.cashfree_order_id, orderId)).limit(1);
      if (recharge.length > 0 && recharge[0].status === 'pending') {
        await db.update(recharges).set({
          status: 'paid',
          cashfree_payment_id: paymentId?.toString(),
          paid_at: new Date(),
        }).where(eq(recharges.id, recharge[0].id));
      }
    }

    if (event.type === 'PAYMENT_FAILED_WEBHOOK') {
      const orderId = event.data?.order?.order_id;
      if (orderId) {
        await db.update(recharges).set({ status: 'failed' })
          .where(eq(recharges.cashfree_order_id, orderId));
      }
    }

    if (event.type === 'REFUND_STATUS_WEBHOOK') {
      const orderId = event.data?.order?.order_id;
      const refundId = event.data?.refund?.cf_refund_id?.toString();
      const refundAmountRupees = event.data?.refund?.refund_amount;
      const refundStatus = event.data?.refund?.refund_status; // SUCCESS | PENDING | CANCELLED

      if (orderId) {
        const recharge = await db.select().from(recharges).where(eq(recharges.cashfree_order_id, orderId)).limit(1);
        if (recharge.length > 0) {
          const amountPaise = Math.round((refundAmountRupees ?? 0) * 100);
          await db.insert(refunds).values({
            id: generateOrderId(),
            recharge_id: recharge[0].id,
            operator_id: recharge[0].operator_id,
            amount_paise: amountPaise,
            cashfree_refund_id: refundId,
            status: refundStatus === 'SUCCESS' ? 'processed' : refundStatus === 'CANCELLED' ? 'failed' : 'pending',
          });
        }
      }
    }

    if (event.type === 'SETTLEMENT_STATUS_WEBHOOK') {
      const settlementId = event.data?.settlement?.cf_settlement_id?.toString();
      const amountRupees = event.data?.settlement?.settlement_amount;
      const vendorId = event.data?.vendor?.vendor_id;

      if (settlementId && amountRupees != null) {
        // Map vendor_id back to our operator via cashfree_vendor_id
        const { operators } = await import('@/lib/db/schema');
        const { eq: drizzleEq } = await import('drizzle-orm');
        const operatorRows = vendorId
          ? await db.select().from(operators).where(drizzleEq(operators.cashfree_vendor_id, vendorId)).limit(1)
          : [];

        await db.insert(settlements).values({
          id: generateOrderId(),
          operator_id: operatorRows[0]?.id ?? null,
          cashfree_settlement_id: settlementId,
          amount_paise: Math.round(amountRupees * 100),
          settled_at: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

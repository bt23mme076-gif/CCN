import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { z } from 'zod';

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  rechargeId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await requireCustomerAuth();
    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      rechargeId,
    } = verifyPaymentSchema.parse(body);

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      // Update recharge status to failed
      await db
        .update(recharges)
        .set({ status: 'failed' })
        .where(eq(recharges.id, rechargeId));

      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Update recharge status to paid
    await db
      .update(recharges)
      .set({
        status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        paid_at: new Date(),
      })
      .where(eq(recharges.id, rechargeId));

    return NextResponse.json({ success: true });
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

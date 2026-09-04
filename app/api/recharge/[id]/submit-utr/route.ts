import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sendPushToAdmin } from '@/lib/push';
import { clearDue } from '@/lib/payments/clearDue';

export const dynamic = 'force-dynamic';

const schema = z.object({ utr: z.string().trim().min(1).max(50) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCustomerAuth();
    const { id } = await params;
    const { utr } = schema.parse(await request.json());

    const recharge = await db
      .select()
      .from(recharges)
      .where(and(eq(recharges.id, id), eq(recharges.customer_id, user.customerId)))
      .limit(1);

    if (recharge.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (recharge[0].status !== 'pending') {
      return NextResponse.json({ error: 'Order already processed' }, { status: 400 });
    }

    await db
      .update(recharges)
      .set({ status: 'paid', upi_reference: utr, paid_at: new Date() })
      .where(eq(recharges.id, id));

    await clearDue(user.customerId, recharge[0].due_amount_paise);

    const customer = await db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1);
    if (customer.length > 0) {
      const c = customer[0];
      sendPushToAdmin({
        title: '💳 UPI Payment Claimed — Verify & Activate',
        body: `${c.name} ne ₹${(recharge[0].amount / 100).toFixed(0)} ka ${recharge[0].plan_name} UPI se pay kiya (UTR: ${utr}). PhonePe Business mein confirm karke activate karein.`,
        url: '/admin/pending',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Submit UTR error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

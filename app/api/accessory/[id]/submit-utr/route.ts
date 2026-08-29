import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessoryOrders, customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sendPushToAdmin } from '@/lib/push';

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

    const order = await db
      .select()
      .from(accessoryOrders)
      .where(and(eq(accessoryOrders.id, id), eq(accessoryOrders.customer_id, user.customerId)))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order[0].status !== 'pending') {
      return NextResponse.json({ error: 'Order already processed' }, { status: 400 });
    }

    await db
      .update(accessoryOrders)
      .set({ status: 'paid', upi_reference: utr, paid_at: new Date() })
      .where(eq(accessoryOrders.id, id));

    const customer = await db.select().from(customers).where(eq(customers.id, user.customerId)).limit(1);
    if (customer.length > 0) {
      const c = customer[0];
      sendPushToAdmin({
        title: '📦 UPI Payment Claimed — Verify & Deliver',
        body: `${c.name} ne ₹${(order[0].amount / 100).toFixed(0)} ka ${order[0].accessory_name} UPI se pay kiya (UTR: ${utr}). PhonePe Business mein confirm karke deliver karein.`,
        url: '/admin/deliveries',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Submit accessory UTR error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

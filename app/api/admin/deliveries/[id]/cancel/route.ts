import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessoryOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const orderId = params.id;

    const [order] = await db.select().from(accessoryOrders).where(eq(accessoryOrders.id, orderId)).limit(1);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'delivered') return NextResponse.json({ error: 'Cannot cancel a delivered order' }, { status: 400 });

    await db.update(accessoryOrders).set({ status: 'failed' }).where(eq(accessoryOrders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}

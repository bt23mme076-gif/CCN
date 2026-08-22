import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessoryOrders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const orderId = (await params).id;

    const [order] = await db.select().from(accessoryOrders).where(and(eq(accessoryOrders.id, orderId), eq(accessoryOrders.operator_id, admin.operatorId))).limit(1);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status === 'delivered') return NextResponse.json({ error: 'Cannot cancel a delivered order' }, { status: 400 });

    await db.update(accessoryOrders).set({ status: 'failed' }).where(and(eq(accessoryOrders.id, orderId), eq(accessoryOrders.operator_id, admin.operatorId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}

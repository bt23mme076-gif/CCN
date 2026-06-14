import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessoryOrders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminAuth();
    const orderId = params.id;

    // Get order details
    const order = await db
      .select()
      .from(accessoryOrders)
      .where(eq(accessoryOrders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = order[0];

    if (orderData.status !== 'paid' && orderData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Order must be paid or pending before it can be marked as delivered' },
        { status: 400 }
      );
    }

    // Update order status to delivered
    await db
      .update(accessoryOrders)
      .set({
        status: 'delivered',
        delivered_at: new Date(),
        delivered_by: admin.username,
      })
      .where(eq(accessoryOrders.id, orderId));

    // Get updated order record
    const updatedOrder = await db
      .select()
      .from(accessoryOrders)
      .where(eq(accessoryOrders.id, orderId))
      .limit(1);

    return NextResponse.json({ order: updatedOrder[0] });
  } catch (error) {
    console.error('Mark order delivered error:', error);
    return NextResponse.json(
      { error: 'Failed to mark order as delivered' },
      { status: 500 }
    );
  }
}

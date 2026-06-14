import { NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { accessoryOrders } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireCustomerAuth();

    const orders = await db
      .select()
      .from(accessoryOrders)
      .where(eq(accessoryOrders.customer_id, user.customerId))
      .orderBy(desc(accessoryOrders.created_at));

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get accessory orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessory order history' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const [recharge] = await db.select().from(recharges).where(eq(recharges.id, orderId)).limit(1);
    if (!recharge) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: recharge.status,
      plan_name: recharge.plan_name,
      amount: recharge.amount,
      expires_at: recharge.expires_at,
    });
  } catch (error) {
    console.error('Guest order status error:', error);
    return NextResponse.json({ error: 'Failed to fetch order status' }, { status: 500 });
  }
}

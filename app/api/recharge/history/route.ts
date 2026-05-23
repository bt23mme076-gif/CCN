import { NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const user = await requireCustomerAuth();

    const customerRecharges = await db
      .select()
      .from(recharges)
      .where(eq(recharges.customer_id, user.customerId))
      .orderBy(desc(recharges.created_at));

    return NextResponse.json({ recharges: customerRecharges });
  } catch (error) {
    console.error('Get recharge history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recharge history' },
      { status: 500 }
    );
  }
}

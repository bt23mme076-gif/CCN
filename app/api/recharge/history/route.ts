import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const cid = request.nextUrl.searchParams.get('cid'); // 'primary' | connection_id

    let condition;
    if (!cid || cid === 'primary') {
      // Primary STB: recharges where connection_id is null
      condition = and(eq(recharges.customer_id, user.customerId), isNull(recharges.connection_id));
    } else {
      // Additional connection: recharges for that connection_id
      condition = and(eq(recharges.customer_id, user.customerId), eq(recharges.connection_id, cid));
    }

    const customerRecharges = await db
      .select()
      .from(recharges)
      .where(condition)
      .orderBy(desc(recharges.created_at));

    return NextResponse.json({ recharges: customerRecharges });
  } catch (error) {
    console.error('Get recharge history error:', error);
    return NextResponse.json({ error: 'Failed to fetch recharge history' }, { status: 500 });
  }
}

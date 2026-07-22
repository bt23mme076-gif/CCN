import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateConnectionAccess } from '@/lib/connections';

export async function GET(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();

    const cid = request.nextUrl.searchParams.get('cid');
    let targetId = user.customerId;

    if (cid && cid !== user.customerId) {
      const valid = await validateConnectionAccess(user.customerId, cid);
      if (!valid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      targetId = valid;
    }

    const customerRecharges = await db
      .select()
      .from(recharges)
      .where(eq(recharges.customer_id, targetId))
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

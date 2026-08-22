import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { enabled, amount } = await request.json();

    await db
      .update(customers)
      .set({
        fast_recharge_enabled: Boolean(enabled),
        fast_recharge_amount: enabled ? Math.round(Number(amount) * 100) : 0,
      })
      .where(and(eq(customers.id, (await params).id), eq(customers.operator_id, admin.operatorId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fast recharge toggle error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

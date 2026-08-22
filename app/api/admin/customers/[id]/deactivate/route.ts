import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { recharges, customers } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const customerId = (await params).id;

    // 1. Verify customer exists and belongs to this operator
    const customer = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.operator_id, admin.operatorId)))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // 2. Deactivate all active recharges by setting expires_at to now()
    const now = new Date();
    await db
      .update(recharges)
      .set({
        expires_at: now,
      })
      .where(
        and(
          eq(recharges.customer_id, customerId),
          eq(recharges.status, 'activated'),
          gt(recharges.expires_at, now)
        )
      );

    return NextResponse.json({ success: true, message: 'All active subscriptions deactivated successfully' });
  } catch (error) {
    console.error('Admin manual deactivation error:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate customer subscription' },
      { status: 500 }
    );
  }
}

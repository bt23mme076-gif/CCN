import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const { amount } = await request.json(); // rupees, 0 = clear due

    if (typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const updated = await db
      .update(customers)
      .set({ outstanding_balance: amount })
      .where(eq(customers.id, params.id))
      .returning({ id: customers.id, outstanding_balance: customers.outstanding_balance });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer: updated[0] });
  } catch (error) {
    console.error('PATCH /api/admin/customers/[id]/dues error:', error);
    return NextResponse.json({ error: 'Failed to update due' }, { status: 500 });
  }
}

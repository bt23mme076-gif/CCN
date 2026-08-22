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
    const { notes } = await request.json();

    const updated = await db
      .update(customers)
      .set({ notes: notes || null })
      .where(and(eq(customers.id, (await params).id), eq(customers.operator_id, admin.operatorId)))
      .returning({ id: customers.id, notes: customers.notes });

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer: updated[0] });
  } catch (error) {
    console.error('PATCH notes error:', error);
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
  }
}

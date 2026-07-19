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
    const { enabled } = await request.json();

    await db
      .update(customers)
      .set({ fast_recharge_enabled: Boolean(enabled) })
      .where(eq(customers.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fast recharge toggle error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

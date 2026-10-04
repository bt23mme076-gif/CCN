import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ mode: z.enum(['default', 'payu', 'upi']) });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { mode } = schema.parse(await request.json());

    await db
      .update(customers)
      .set({ payment_mode: mode })
      .where(and(eq(customers.id, (await params).id), eq(customers.operator_id, admin.operatorId)));

    return NextResponse.json({ success: true, mode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Payment mode update error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

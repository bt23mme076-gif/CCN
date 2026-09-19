import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { operators, admins, customers } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

async function authCheck() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'super_admin') return null;
  return payload;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  business_name: z.string().min(1).optional(),
  commission_percent: z.number().int().min(0).max(50).optional(),
  kyc_status: z.enum(['pending', 'approved', 'rejected']).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  upi_vpa: z.string().trim().max(100).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = updateSchema.parse(await request.json());
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await db.update(operators).set(body).where(eq(operators.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    console.error('Update operator error:', error);
    return NextResponse.json({ error: 'Failed to update operator' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const [{ value: customerCount }] = await db
    .select({ value: count() })
    .from(customers)
    .where(eq(customers.operator_id, id));

  if (customerCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this operator still has ${customerCount} customer(s). Remove them first.` },
      { status: 409 }
    );
  }

  await db.delete(admins).where(eq(admins.operator_id, id));
  await db.delete(operators).where(eq(operators.id, id));

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { operators, admins, customers } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authCheck() {
  const cookieStore = await cookies();
  const token = cookieStore.get('super_admin_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'super_admin') return null;
  return payload;
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

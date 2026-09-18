import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers, recharges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

// Restore a soft-deleted customer (and any recharges cascade-deleted with it).
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.update(customers).set({ deleted_at: null }).where(eq(customers.id, id));
  await db.update(recharges).set({ deleted_at: null }).where(eq(recharges.customer_id, id));

  return NextResponse.json({ success: true });
}

// Permanently purge a customer and their recharges. Only a super admin can do this.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await authCheck()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(recharges).where(eq(recharges.customer_id, id));
  await db.delete(customers).where(eq(customers.id, id));

  return NextResponse.json({ success: true });
}

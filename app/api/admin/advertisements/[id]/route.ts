import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { advertisements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
    if ('business_name' in body) updates.business_name = body.business_name;
    if ('phone' in body) updates.phone = body.phone;
    if ('expires_at' in body) updates.expires_at = body.expires_at ? new Date(body.expires_at) : null;

    const [ad] = await db
      .update(advertisements)
      .set(updates)
      .where(eq(advertisements.id, params.id))
      .returning();

    if (!ad) return NextResponse.json({ error: 'Advertisement not found' }, { status: 404 });
    return NextResponse.json({ advertisement: ad });
  } catch (error) {
    console.error('Admin PATCH /api/admin/advertisements/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update advertisement' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    await db.delete(advertisements).where(eq(advertisements.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE /api/admin/advertisements/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete advertisement' }, { status: 500 });
  }
}

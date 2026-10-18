import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { streamAdPackages } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
    if ('ad_type' in body) {
      if (body.ad_type !== 'l_shape' && body.ad_type !== 'full_screen') {
        return NextResponse.json({ error: 'Invalid ad type' }, { status: 400 });
      }
      updates.ad_type = body.ad_type;
    }
    if ('name' in body) {
      if (!body.name?.trim()) return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
      updates.name = body.name.trim();
    }
    if ('description' in body) updates.description = body.description?.trim() || null;
    if ('price' in body) {
      const price = Math.round(Number(body.price));
      if (!Number.isFinite(price) || price < 100) return NextResponse.json({ error: 'Price must be at least ₹1' }, { status: 400 });
      updates.price = price;
    }
    if ('duration_days' in body) {
      const days = Math.round(Number(body.duration_days));
      if (!Number.isFinite(days) || days < 1) return NextResponse.json({ error: 'Duration must be at least 1 day' }, { status: 400 });
      updates.duration_days = days;
    }

    const [pkg] = await db
      .update(streamAdPackages)
      .set(updates)
      .where(and(eq(streamAdPackages.id, (await params).id), eq(streamAdPackages.operator_id, admin.operatorId)))
      .returning();

    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    console.error('Admin PATCH /api/admin/stream-ads/packages/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    await db
      .delete(streamAdPackages)
      .where(and(eq(streamAdPackages.id, (await params).id), eq(streamAdPackages.operator_id, admin.operatorId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE /api/admin/stream-ads/packages/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
  }
}

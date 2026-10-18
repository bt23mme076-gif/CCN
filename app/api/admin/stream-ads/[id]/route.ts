import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { streamAdBookings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'paid', 'approved', 'live', 'completed', 'rejected', 'failed'];
const AD_TYPES = ['l_shape', 'full_screen'];
const TEXT_FIELDS = ['advertiser_name', 'business_name', 'phone', 'package_name', 'scroll_text', 'notes', 'admin_note', 'upi_reference'] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const [booking] = await db
      .select()
      .from(streamAdBookings)
      .where(and(eq(streamAdBookings.id, (await params).id), eq(streamAdBookings.operator_id, admin.operatorId)))
      .limit(1);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Admin GET /api/admin/stream-ads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    for (const field of TEXT_FIELDS) {
      if (field in body) {
        const value = typeof body[field] === 'string' ? body[field].trim() : '';
        updates[field] = value || null;
      }
    }
    if ('advertiser_name' in updates && !updates.advertiser_name) {
      return NextResponse.json({ error: 'Advertiser name is required' }, { status: 400 });
    }
    if ('phone' in updates && !updates.phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }
    if ('package_name' in updates && !updates.package_name) {
      return NextResponse.json({ error: 'Package name is required' }, { status: 400 });
    }
    if ('status' in body) {
      if (!STATUSES.includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      updates.status = body.status;
      if (body.status === 'paid' || body.status === 'approved' || body.status === 'live') {
        // Marking an unpaid booking as paid by hand (e.g. cash) — stamp it.
        const [current] = await db
          .select({ paid_at: streamAdBookings.paid_at })
          .from(streamAdBookings)
          .where(and(eq(streamAdBookings.id, (await params).id), eq(streamAdBookings.operator_id, admin.operatorId)))
          .limit(1);
        if (current && !current.paid_at) updates.paid_at = new Date();
      }
    }
    if ('ad_type' in body) {
      if (!AD_TYPES.includes(body.ad_type)) return NextResponse.json({ error: 'Invalid ad type' }, { status: 400 });
      updates.ad_type = body.ad_type;
    }
    if ('amount' in body) {
      const amount = Math.round(Number(body.amount));
      if (!Number.isFinite(amount) || amount < 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      updates.amount = amount;
    }
    if ('duration_days' in body) {
      const days = Math.round(Number(body.duration_days));
      if (!Number.isFinite(days) || days < 1) return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
      updates.duration_days = days;
    }
    for (const field of ['start_date', 'end_date'] as const) {
      if (field in body) updates[field] = body[field] ? new Date(`${body[field]}T00:00:00+05:30`) : null;
    }
    if ('banner_data' in body) {
      if (typeof body.banner_data !== 'string' || !body.banner_data.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid banner image' }, { status: 400 });
      }
      updates.banner_data = body.banner_data;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const [booking] = await db
      .update(streamAdBookings)
      .set(updates)
      .where(and(eq(streamAdBookings.id, (await params).id), eq(streamAdBookings.operator_id, admin.operatorId)))
      .returning();

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Admin PATCH /api/admin/stream-ads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    await db
      .delete(streamAdBookings)
      .where(and(eq(streamAdBookings.id, (await params).id), eq(streamAdBookings.operator_id, admin.operatorId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE /api/admin/stream-ads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { streamAdBookings, streamAdPackages } from '@/lib/db/schema';
import { asc, desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Bookings are listed without banner_data (base64, up to ~3 MB each) —
// the detail endpoint returns it when the admin opens a booking.
export async function GET() {
  try {
    const admin = await requireAdminAuth();
    const [bookings, packages] = await Promise.all([
      db
        .select({
          id: streamAdBookings.id,
          package_id: streamAdBookings.package_id,
          ad_type: streamAdBookings.ad_type,
          package_name: streamAdBookings.package_name,
          duration_days: streamAdBookings.duration_days,
          amount: streamAdBookings.amount,
          advertiser_name: streamAdBookings.advertiser_name,
          business_name: streamAdBookings.business_name,
          phone: streamAdBookings.phone,
          scroll_text: streamAdBookings.scroll_text,
          start_date: streamAdBookings.start_date,
          end_date: streamAdBookings.end_date,
          notes: streamAdBookings.notes,
          admin_note: streamAdBookings.admin_note,
          status: streamAdBookings.status,
          upi_reference: streamAdBookings.upi_reference,
          paid_at: streamAdBookings.paid_at,
          created_at: streamAdBookings.created_at,
        })
        .from(streamAdBookings)
        .where(eq(streamAdBookings.operator_id, admin.operatorId))
        .orderBy(desc(streamAdBookings.created_at)),
      db
        .select()
        .from(streamAdPackages)
        .where(eq(streamAdPackages.operator_id, admin.operatorId))
        .orderBy(asc(streamAdPackages.ad_type), asc(streamAdPackages.price)),
    ]);
    return NextResponse.json({ bookings, packages });
  } catch (error) {
    console.error('Admin GET /api/admin/stream-ads error:', error);
    return NextResponse.json({ error: 'Failed to fetch live ads' }, { status: 500 });
  }
}

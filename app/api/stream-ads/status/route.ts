import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { streamAdBookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  try {
    const [booking] = await db
      .select({
        status: streamAdBookings.status,
        package_name: streamAdBookings.package_name,
        ad_type: streamAdBookings.ad_type,
        amount: streamAdBookings.amount,
        start_date: streamAdBookings.start_date,
        end_date: streamAdBookings.end_date,
        admin_note: streamAdBookings.admin_note,
      })
      .from(streamAdBookings)
      .where(eq(streamAdBookings.id, orderId))
      .limit(1);

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    console.error('GET /api/stream-ads/status error:', error);
    return NextResponse.json({ error: 'Failed to load booking' }, { status: 500 });
  }
}

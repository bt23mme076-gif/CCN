import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { streamAdBookings } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { notifyAdmin } from '@/lib/push';

export const dynamic = 'force-dynamic';

const schema = z.object({ utr: z.string().trim().min(1).max(50) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { utr } = schema.parse(await request.json());

    const [booking] = await db
      .update(streamAdBookings)
      .set({ status: 'paid', upi_reference: utr, paid_at: new Date() })
      .where(and(eq(streamAdBookings.id, id), eq(streamAdBookings.status, 'pending')))
      .returning();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or already processed' }, { status: 400 });
    }

    await notifyAdmin({
      title: '📢 Live Ad Booking — UPI Claimed',
      body: `${booking.advertiser_name} paid ₹${(booking.amount / 100).toFixed(0)} for the ${booking.package_name} ad via UPI (UTR: ${utr}). Confirm in PhonePe Business, then approve.`,
      url: '/admin/stream-ads',
      tag: `stream-ad-${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Submit stream ad UTR error:', error);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

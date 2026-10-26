import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { generateAdReceiptHTML, loadAdReceiptData, PAID_AD_STATUSES, receiptHtmlResponse } from '@/lib/adReceipt';

export const dynamic = 'force-dynamic';

// Admin view of an ad booking's receipt (scoped to the admin's operator).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdminAuth();
    const booking = await loadAdReceiptData((await params).id, admin.operatorId);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (!PAID_AD_STATUSES.includes(booking.status)) {
      return NextResponse.json({ error: 'This booking has not been paid' }, { status: 409 });
    }
    return receiptHtmlResponse(generateAdReceiptHTML(booking));
  } catch (error) {
    console.error('Admin ad receipt error:', error);
    return NextResponse.json({ error: 'Failed to load receipt' }, { status: 500 });
  }
}

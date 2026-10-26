import { NextRequest, NextResponse } from 'next/server';
import { generateAdReceiptHTML, loadAdReceiptData, PAID_AD_STATUSES, receiptHtmlResponse, verifyAdReceiptToken } from '@/lib/adReceipt';

export const dynamic = 'force-dynamic';

// Public advertiser receipt — needs the HMAC token from the post-payment link.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!verifyAdReceiptToken(id, request.nextUrl.searchParams.get('t'))) {
    return NextResponse.json({ error: 'Invalid receipt link' }, { status: 403 });
  }
  try {
    const booking = await loadAdReceiptData(id);
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (!PAID_AD_STATUSES.includes(booking.status)) {
      return NextResponse.json({ error: 'Receipt is available once the payment is confirmed' }, { status: 409 });
    }
    return receiptHtmlResponse(generateAdReceiptHTML(booking));
  } catch (error) {
    console.error('Ad receipt error:', error);
    return NextResponse.json({ error: 'Failed to load receipt' }, { status: 500 });
  }
}

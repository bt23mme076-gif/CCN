import { NextRequest, NextResponse } from 'next/server';
import { getUpiPaymentStatus } from '@/lib/payments/upiAuto';

export const dynamic = 'force-dynamic';

// Polled by the UPI popup to flip to "Payment received" once the bank credit
// is matched. Only reveals paid/pending for an order id the caller already has.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    return NextResponse.json({ status: await getUpiPaymentStatus(orderId) });
  } catch (error) {
    console.error('UPI status error:', error);
    return NextResponse.json({ status: 'pending' });
  }
}

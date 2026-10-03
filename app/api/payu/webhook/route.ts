import { NextRequest, NextResponse } from 'next/server';
import { settlePayuResult } from '@/lib/payments/payuSettle';

export const dynamic = 'force-dynamic';

// Server-to-server webhook (PayU dashboard → Developer → Webhooks, events:
// Payment Success + Payment Failure). Records payments where the customer
// closed the browser before PayU redirected them back to /api/payu/callback.
export async function POST(request: NextRequest) {
  try {
    const fields: Record<string, string> = {};
    if ((request.headers.get('content-type') ?? '').includes('application/json')) {
      const body = await request.json();
      for (const [key, value] of Object.entries(body ?? {})) fields[key] = String(value ?? '');
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => { fields[key] = String(value); });
    }
    await settlePayuResult(fields);
  } catch (error) {
    console.error('PayU webhook error:', error);
  }
  // Always 200 so PayU doesn't retry payloads we've already logged as bad.
  return NextResponse.json({ ok: true });
}

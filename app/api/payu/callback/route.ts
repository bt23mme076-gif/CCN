import { NextRequest, NextResponse } from 'next/server';
import { settlePayuResult } from '@/lib/payments/payuSettle';

export const dynamic = 'force-dynamic';

// PayU posts here for both success (surl) and failure (furl) — same endpoint,
// differentiated by the `status` field. This is the authoritative, hash-verified
// confirmation; any client-side responseHandler in bolt.js is just UI, not state.
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectTo = (path: string) => NextResponse.redirect(`${origin}${path}`, { status: 303 });

  const fields: Record<string, string> = {};
  try {
    const formData = await request.formData();
    formData.forEach((value, key) => { fields[key] = String(value); });
  } catch {
    return redirectTo('/');
  }

  const { txnid, udf1, udf2 } = fields;
  const isGuest = udf2 === 'guest';

  const valid = await settlePayuResult(fields);
  if (!valid) {
    return redirectTo(isGuest ? `/recharge-status?order_id=${txnid || ''}` : '/dashboard');
  }

  if (udf1 === 'accessory') return redirectTo(`/dashboard?order_id=${txnid}`);
  return redirectTo(isGuest ? `/recharge-status?order_id=${txnid}` : `/dashboard?order_id=${txnid}`);
}

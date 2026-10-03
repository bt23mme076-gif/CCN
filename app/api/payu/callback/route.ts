import { NextRequest, NextResponse } from 'next/server';
import { settlePayuResult, payuReturnPath } from '@/lib/payments/payuSettle';

export const dynamic = 'force-dynamic';

// PayU posts here for both success (surl) and failure (furl) — same endpoint,
// differentiated by the `status` field. This is the authoritative, hash-verified
// confirmation for redirect-based payments (bolt.js overlay results go via
// /api/payu/confirm instead).
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

  const valid = await settlePayuResult(fields);
  return redirectTo(await payuReturnPath(fields, valid));
}

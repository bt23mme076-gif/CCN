import { NextRequest, NextResponse } from 'next/server';
import { settlePayuResult, payuReturnPath } from '@/lib/payments/payuSettle';

export const dynamic = 'force-dynamic';

// bolt.js finishes most payments inside its overlay and hands the signed
// result to the page instead of redirecting to surl/furl. The page posts it
// here; the reverse-hash check (salt-signed) is what makes it trustworthy.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(body ?? {})) {
      if (value !== null && typeof value !== 'object') fields[key] = String(value);
    }
    const valid = await settlePayuResult(fields);
    return NextResponse.json({ redirect: await payuReturnPath(fields, valid) });
  } catch (error) {
    console.error('PayU confirm error:', error);
    return NextResponse.json({ redirect: '/dashboard' });
  }
}

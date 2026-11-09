import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { recordUpiCredit } from '@/lib/payments/upiAuto';

export const dynamic = 'force-dynamic';

const SECRET = process.env.SMS_WEBHOOK_SECRET || '';
const TEXT_KEYS = ['message', 'msg', 'text', 'body', 'content', 'sms', 'notification'];
const SENDER_KEYS = ['from', 'sender', 'address', 'phone', 'senderId', 'app', 'package', 'title'];

const sha = (s: string) => createHash('sha256').update(s).digest();
const pick = (o: Record<string, unknown>, keys: string[]) =>
  String(keys.map((k) => o[k]).find((v) => typeof v === 'string' && v) ?? '');

// Webhook for an Android SMS/notification-forwarder app on the operator's phone.
// Auth: ?key=SMS_WEBHOOK_SECRET or header x-sms-secret.
export async function POST(request: NextRequest) {
  if (!SECRET) return NextResponse.json({ error: 'SMS webhook not configured' }, { status: 503 });
  const key = request.headers.get('x-sms-secret') ?? request.nextUrl.searchParams.get('key') ?? '';
  if (!timingSafeEqual(sha(key), sha(SECRET))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const type = request.headers.get('content-type') ?? '';
    let data: Record<string, unknown>;
    if (type.includes('json')) data = await request.json().catch(() => ({}));
    else if (type.includes('form')) data = Object.fromEntries(await request.formData());
    else data = { message: await request.text() };

    const text = pick(data, TEXT_KEYS);
    if (!text) return NextResponse.json({ error: 'No message text found' }, { status: 400 });
    return NextResponse.json(await recordUpiCredit(text, pick(data, SENDER_KEYS)));
  } catch (error) {
    console.error('UPI SMS webhook error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

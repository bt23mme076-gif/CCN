import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const { endpoint, keys } = await request.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // Remove old subscriptions for this customer (device change etc.)
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.customer_id, user.customerId));

    await db.insert(pushSubscriptions).values({
      id: randomBytes(16).toString('hex'),
      customer_id: user.customerId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCustomerAuth();
    const { endpoint, keys } = await request.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    // One row per device: replace only this browser's old row (same endpoint),
    // so a customer who uses both a phone and a computer gets pushes on both.
    // (It used to delete every subscription for the customer, so only the last
    // device they opened the dashboard on was ever notified.)
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));

    // Keep at most the 4 newest devices per customer.
    const existing = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.customer_id, user.customerId))
      .orderBy(desc(pushSubscriptions.created_at));
    const stale = existing.slice(3).map((s) => s.id);
    if (stale.length > 0) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, stale));

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

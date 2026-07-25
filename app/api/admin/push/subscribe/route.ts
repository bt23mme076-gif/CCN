import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { adminPushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const existing = await db.select().from(adminPushSubscriptions).where(eq(adminPushSubscriptions.endpoint, endpoint)).limit(1);
    if (existing.length === 0) {
      await db.insert(adminPushSubscriptions).values({
        id: `apush_${randomBytes(8).toString('hex')}`,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin push subscribe error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

webpush.setVapidDetails(
  'mailto:admin@ccn.atyant.in',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToCustomer(customerId: string, payload: { title: string; body: string; url?: string }) {
  try {
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.customer_id, customerId));
    if (subs.length === 0) return;

    const sub = subs[0];
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (error) {
    // Subscription may be expired — ignore silently
    console.error('Push send error:', error);
  }
}

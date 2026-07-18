import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function sendPushToCustomer(customerId: string, payload: { title: string; body: string; url?: string }) {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return;

    webpush.setVapidDetails('mailto:admin@ccn.atyant.in', publicKey, privateKey);

    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.customer_id, customerId));
    if (subs.length === 0) return;

    const sub = subs[0];
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (error) {
    console.error('Push send error:', error);
  }
}

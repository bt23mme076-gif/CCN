import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions, adminPushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendTelegramAlert } from '@/lib/telegram';
import { VAPID_PUBLIC_KEY } from '@/lib/vapid';

export async function sendPushToCustomer(customerId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
  try {
    const publicKey = VAPID_PUBLIC_KEY;
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

// Every admin alert channel at once — browser push + Telegram. Awaited by
// callers so Vercel doesn't freeze the function before they're delivered.
export async function notifyAdmin(payload: { title: string; body: string; url?: string; tag?: string }) {
  await Promise.allSettled([sendPushToAdmin(payload), sendTelegramAlert(payload)]);
}

export async function sendPushToAdmin(payload: { title: string; body: string; url?: string; tag?: string }) {
  try {
    const publicKey = VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) return;

    webpush.setVapidDetails('mailto:admin@ccn.atyant.in', publicKey, privateKey);

    const subs = await db.select().from(adminPushSubscriptions);
    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      )
    );
  } catch (error) {
    console.error('Admin push send error:', error);
  }
}

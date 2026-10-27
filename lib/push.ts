import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions, adminPushSubscriptions } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { sendTelegramAlert } from '@/lib/telegram';
import { VAPID_PUBLIC_KEY } from '@/lib/vapid';

type PushPayload = { title: string; body: string; url?: string; tag?: string };
type StoredSub = { id: string; endpoint: string; p256dh: string; auth: string };

function vapidReady(): boolean {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!VAPID_PUBLIC_KEY || !privateKey) return false;
  webpush.setVapidDetails('mailto:admin@ccn.atyant.in', VAPID_PUBLIC_KEY, privateKey);
  return true;
}

// Sends to every subscription and returns the ids the push service reports as
// gone (404/410: uninstalled app, cleared site data, expired) so they can be
// deleted instead of silently swallowing every future notification.
async function sendToAll(subs: StoredSub[], payload: PushPayload, label: string): Promise<string[]> {
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload))
    )
  );
  const gone: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') return;
    const code = (r.reason as { statusCode?: number })?.statusCode;
    if (code === 404 || code === 410) gone.push(subs[i].id);
    else console.error(`${label} push send error:`, r.reason);
  });
  return gone;
}

export async function sendPushToCustomer(customerId: string, payload: PushPayload) {
  try {
    if (!vapidReady()) return;
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.customer_id, customerId));
    if (subs.length === 0) return;
    const gone = await sendToAll(subs, payload, 'Customer');
    if (gone.length > 0) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, gone));
  } catch (error) {
    console.error('Push send error:', error);
  }
}

// Every admin alert channel at once — browser push + Telegram. Awaited by
// callers so Vercel doesn't freeze the function before they're delivered.
export async function notifyAdmin(payload: PushPayload) {
  await Promise.allSettled([sendPushToAdmin(payload), sendTelegramAlert(payload)]);
}

export async function sendPushToAdmin(payload: PushPayload) {
  try {
    if (!vapidReady()) return;
    const subs = await db.select().from(adminPushSubscriptions);
    if (subs.length === 0) return;
    const gone = await sendToAll(subs, payload, 'Admin');
    if (gone.length > 0) await db.delete(adminPushSubscriptions).where(inArray(adminPushSubscriptions.id, gone));
  } catch (error) {
    console.error('Admin push send error:', error);
  }
}

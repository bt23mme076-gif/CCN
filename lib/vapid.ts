// VAPID public key for web push. Not a secret — the browser needs it to
// subscribe, so it ships to every visitor anyway. Kept in code so only the
// matching VAPID_PRIVATE_KEY has to be set on Vercel. An env var, if set,
// still wins (e.g. after rotating keys).
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  'BOvHiWLIrh_o7TybZP5B3r-W5g3JN8prTP5MHV59I08Wky7CTzV0COvvQpTHgrngvtWXI_mGwqHZiFXabA8pGhs';

function urlBase64ToBytes(base64Url: string): Uint8Array {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
}

// Browser-side: returns a push subscription made with the current VAPID key,
// asking for permission if needed. A subscription left over from an older key
// (e.g. the pre-Vercel deployment) can't receive our pushes, so it's dropped
// and re-created. Returns null if push is unsupported or permission denied.
export async function ensurePushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  const key = urlBase64ToBytes(VAPID_PUBLIC_KEY);

  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    if (sameKey(existing.options.applicationServerKey, key)) return existing;
    await existing.unsubscribe();
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key.buffer as ArrayBuffer });
}

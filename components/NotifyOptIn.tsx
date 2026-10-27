'use client';

import { useEffect, useState } from 'react';
import { ensurePushSubscription } from '@/lib/vapid';

type State = 'hidden' | 'ask' | 'denied' | 'done';

async function saveSubscription(sub: PushSubscription) {
  const json = sub.toJSON();
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
  });
}

// Customer push opt-in. Browsers (Chrome especially) quietly block permission
// prompts that fire on page load, so we only ask from a button tap. If
// permission is already granted we just refresh this device's subscription.
export default function NotifyOptIn({ className = '' }: { className?: string }) {
  const [state, setState] = useState<State>('hidden');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'granted') {
      ensurePushSubscription().then((sub) => sub && saveSubscription(sub)).catch(() => {});
      return;
    }
    setState(Notification.permission === 'denied' ? 'denied' : 'ask');
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const sub = await ensurePushSubscription();
      if (sub) {
        await saveSubscription(sub);
        setState('done');
      } else {
        setState(Notification.permission === 'denied' ? 'denied' : 'ask');
      }
    } catch {
      setState(Notification.permission === 'denied' ? 'denied' : 'ask');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'hidden') return null;

  return (
    <div className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(56,189,248,0.10))', border: '1px solid rgba(129,140,248,0.4)' }}>
      <div className="flex items-start gap-3 flex-1">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(129,140,248,0.2)' }}>
          {state === 'done' ? '✅' : '🔔'}
        </div>
        <div>
          {state === 'done' ? (
            <>
              <p className="font-bold text-white">Notifications are on</p>
              <p className="text-sm text-indigo-100/80">You&apos;ll be notified on this device as soon as your recharge is activated.</p>
            </>
          ) : state === 'denied' ? (
            <>
              <p className="font-bold text-white">Notifications are blocked</p>
              <p className="text-sm text-indigo-100/80">
                To know the moment your recharge is activated, allow notifications: tap the 🔒 icon next to the website address → <b>Permissions</b> / <b>Site settings</b> → <b>Notifications</b> → <b>Allow</b>, then reload this page.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-white">Get notified when your recharge is activated</p>
              <p className="text-sm text-indigo-100/80">Turn on notifications and we&apos;ll tell you right away — no need to keep checking.</p>
            </>
          )}
        </div>
      </div>
      {state === 'ask' && (
        <button onClick={turnOn} disabled={busy}
          className="px-5 py-3 rounded-xl font-bold text-white whitespace-nowrap disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366f1, #0ea5e9)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
          {busy ? 'Turning on…' : '🔔 Turn on'}
        </button>
      )}
    </div>
  );
}

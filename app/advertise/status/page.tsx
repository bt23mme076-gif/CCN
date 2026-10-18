'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDateDMY } from '@/lib/utils';
import { AD_TYPE_LABELS, StreamAdType } from '@/components/StreamAdPreview';

interface Booking {
  status: string;
  package_name: string;
  ad_type: StreamAdType;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  admin_note: string | null;
}

const MESSAGES: Record<string, { icon: string; title: string; body: string; color: string }> = {
  pending: { icon: '⏳', title: 'Waiting for payment', body: 'We have not received your payment yet. If you already paid, this page updates automatically.', color: '#facc15' },
  paid: { icon: '🎉', title: 'Payment received!', body: 'Our team is reviewing your banner. You will get a call on your mobile if any change is needed.', color: '#22c55e' },
  approved: { icon: '✅', title: 'Ad approved', body: 'Your banner is approved and scheduled to go live on your start date.', color: '#22c55e' },
  live: { icon: '📺', title: 'Your ad is LIVE', body: 'Your banner is now running on our live stream.', color: '#ef4444' },
  completed: { icon: '🏁', title: 'Ad completed', body: 'Your ad run has finished. Thank you for advertising with us!', color: '#60a5fa' },
  rejected: { icon: '⚠️', title: 'Banner not accepted', body: 'We could not run this banner. Our team will contact you about a change or refund.', color: '#f87171' },
  failed: { icon: '❌', title: 'Payment failed', body: 'The payment did not go through. No ad was booked — please try again.', color: '#f87171' },
};

function StatusInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const paymentFailed = searchParams.get('payment') === 'failed';
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(!orderId);

  useEffect(() => {
    if (!orderId) return;
    let stop = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/stream-ads/status?orderId=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        if (res.status === 404) { setNotFound(true); stop = true; return; }
        if (res.ok) setBooking(await res.json());
      } catch { /* retry next tick */ }
    };
    poll();
    const interval = setInterval(() => { if (!stop) poll(); }, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const status = paymentFailed && (!booking || booking.status === 'pending' || booking.status === 'failed') ? 'failed' : booking?.status;
  const msg = status ? MESSAGES[status] ?? MESSAGES.paid : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">
        {notFound ? (
          <>
            <h1 className="text-2xl font-bold text-white">Booking not found</h1>
            <Link href="/advertise" className="btn-gradient px-6 py-3 rounded-xl font-semibold text-sm">Book an ad</Link>
          </>
        ) : !msg ? (
          <div className="w-12 h-12 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin" />
        ) : (
          <>
            <div className="text-5xl">{msg.icon}</div>
            <h1 className="text-2xl font-bold" style={{ color: msg.color }}>{msg.title}</h1>
            <p className="text-blue-100/80 text-sm">{msg.body}</p>
            {booking && (
              <div className="w-full rounded-2xl p-4 text-sm text-left space-y-2"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex justify-between"><span className="text-gray-400">Ad</span><span className="text-white">{AD_TYPE_LABELS[booking.ad_type] ?? booking.ad_type} · {booking.package_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-white">{formatCurrency(booking.amount)}</span></div>
                {booking.start_date && (
                  <div className="flex justify-between"><span className="text-gray-400">Dates</span>
                    <span className="text-white">{formatDateDMY(booking.start_date)}{booking.end_date && booking.end_date !== booking.start_date ? ` – ${formatDateDMY(booking.end_date)}` : ''}</span>
                  </div>
                )}
                <div className="flex justify-between gap-3"><span className="text-gray-400">Booking ID</span><span className="text-gray-300 font-mono text-xs break-all text-right">{orderId}</span></div>
                {booking.admin_note && <p className="text-yellow-200 text-xs pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>{booking.admin_note}</p>}
              </div>
            )}
            {status === 'failed' && (
              <Link href="/advertise" className="btn-gradient px-6 py-3 rounded-xl font-semibold text-sm">Try again</Link>
            )}
            <p className="text-xs text-gray-500">Save this page link to check your ad status later.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdvertiseStatusPage() {
  return (
    <Suspense fallback={null}>
      <StatusInner />
    </Suspense>
  );
}

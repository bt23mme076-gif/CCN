'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

type Phase = 'verifying' | 'waiting' | 'activated' | 'failed';

const REDIRECT_SECONDS = 5;

function RechargeStatusInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');

  const [phase, setPhase] = useState<Phase>('verifying');
  const [order, setOrder] = useState<{ plan_name: string; amount: number; expires_at: string | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [redirectIn, setRedirectIn] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!orderId) {
      setPhase('failed');
      setErrorMsg('No order found.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/guest/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setPhase('failed');
          setCancelled(!!data.cancelled);
          setErrorMsg(data.cancelled ? 'Payment was cancelled.' : (data.error || 'Payment could not be verified.'));
          return;
        }
        setPhase('waiting');
      } catch {
        setPhase('failed');
        setErrorMsg('Unable to verify payment. Please contact support if amount was deducted.');
      }
    };

    verify();
  }, [orderId]);

  useEffect(() => {
    if (phase !== 'waiting' || !orderId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/guest/order-status?orderId=${orderId}`, { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setOrder(data);
          if (data.status === 'activated') {
            setPhase('activated');
          }
        }
      } catch { /* ignore, retry next tick */ }
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [phase, orderId]);

  // Auto-redirect to homepage on failure/cancellation
  useEffect(() => {
    if (phase !== 'failed') return;
    if (redirectIn <= 0) {
      router.push('/');
      return;
    }
    const t = setTimeout(() => setRedirectIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, redirectIn, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">

        {phase === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <h1 className="text-2xl font-bold text-white">Verifying Payment...</h1>
            <p className="text-blue-200 text-sm">Please wait, this will only take a moment.</p>
          </>
        )}

        {phase === 'waiting' && (
          <>
            <div className="w-16 h-16 border-4 border-white/20 border-t-yellow-400 rounded-full animate-spin" />
            <h1 className="text-2xl font-bold text-white">Payment Confirmed! 🎉</h1>
            <p className="text-blue-200 text-sm">
              {order?.plan_name} — {order ? formatCurrency(order.amount) : ''}
            </p>
            <p className="text-gray-400 text-sm">
              Your recharge is being activated by our operator. Keep your TV & STB switched on.
            </p>
          </>
        )}

        {phase === 'activated' && (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Your TV is Ready!</h1>
            <p className="text-green-300 text-sm">{order?.plan_name} is now active 🎉</p>
            <Link href="/login" className="btn-gradient px-6 py-3 rounded-xl font-semibold text-sm">
              Login to view your dashboard
            </Link>
          </>
        )}

        {phase === 'failed' && (
          <>
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(230,57,70,0.15)', border: '2px solid rgba(230,57,70,0.4)' }}>
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">{cancelled ? 'Payment Cancelled' : 'Something Went Wrong'}</h1>
            <p className="text-red-200 text-sm">{errorMsg}</p>
            <p className="text-gray-400 text-xs">Redirecting to home in {redirectIn}s...</p>
            <Link href="/" className="text-blue-300 text-sm underline">Go now</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function RechargeStatusPage() {
  return (
    <Suspense fallback={null}>
      <RechargeStatusInner />
    </Suspense>
  );
}

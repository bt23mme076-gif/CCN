'use client';

import { useState } from 'react';
import { formatCurrency, formatDateDMY } from '@/lib/utils';
import UpiPaymentModal from '@/components/UpiPaymentModal';
import { launchPayu, PayuLaunchParams } from '@/lib/payments/payuClient';
import { accentGradient } from '@/components/PortalUI';

interface DueRecharge {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  created_at: string;
}

// Shown for recharges the admin marked "payment not received". It depends only
// on that status — not on the MSO portal — so it stays until the customer pays
// or the admin confirms the money arrived.
export default function PaymentDueBanner({ recharges, className = '' }: { recharges: DueRecharge[]; className?: string }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [upiOrder, setUpiOrder] = useState<{ orderId: string; upiLink: string; amount: number } | null>(null);

  const due = recharges.filter((r) => r.status === 'payment_due');
  if (due.length === 0) return null;

  const pay = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/recharge/${id}/repay`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.payu) {
        await launchPayu(data.payu as PayuLaunchParams, () => setBusyId(null));
        return;
      }
      setUpiOrder({ orderId: data.orderId, upiLink: data.upiLink, amount: data.amount });
      setBusyId(null);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not start the payment. Please try again.');
      setBusyId(null);
    }
  };

  if (upiOrder) {
    return (
      <UpiPaymentModal
        upiLink={upiOrder.upiLink}
        amount={upiOrder.amount}
        submitUtrUrl={`/api/recharge/${upiOrder.orderId}/submit-utr`}
        onSubmitted={() => { window.location.href = `/dashboard?order_id=${upiOrder.orderId}`; }}
        onCancel={() => setUpiOrder(null)}
      />
    );
  }

  return (
    <div className={`rounded-2xl p-4 sm:p-5 space-y-3 ${className}`}
      style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 55%, #450a0a 100%)', border: '1px solid #f87171', boxShadow: '0 10px 30px rgba(127,29,29,0.35)' }}>
      {due.map((r) => (
        <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>⚠️</div>
            <div>
              <p className="text-xs uppercase tracking-wider font-extrabold text-white">Payment not received</p>
              <p className="text-sm text-red-50">
                We did not receive your <b>{formatCurrency(r.amount)}</b> payment for <b>{r.plan_name}</b> ({formatDateDMY(r.created_at)}). Please complete it to keep your service. If you have already paid, please contact us.
              </p>
            </div>
          </div>
          <button onClick={() => pay(r.id)} disabled={busyId === r.id}
            className="px-5 py-3 rounded-xl font-bold text-white whitespace-nowrap disabled:opacity-50"
            style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
            {busyId === r.id ? 'Starting…' : `Pay ${formatCurrency(r.amount)} now`}
          </button>
        </div>
      ))}
      {error && <p className="text-sm text-red-100">{error}</p>}
    </div>
  );
}

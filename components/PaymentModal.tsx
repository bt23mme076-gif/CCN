'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { formatCurrency, formatDateDMY, formatDisplayEndDate } from '@/lib/utils';
import { calcDurationPricing } from '@/lib/planDuration';
import UpiPaymentModal from '@/components/UpiPaymentModal';
import { launchPayu, PayuLaunchParams } from '@/lib/payments/payuClient';
import { PremiumModal, PremiumButton } from '@/components/PortalUI';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number;
  } | null;
  months?: number;
  discounts?: Record<number, number>;
  stbNumber: string;
  customerName?: string;
  customerMobile?: string;
  connectionId?: string;
  dueAmount?: number; // customer's current outstanding due, in rupees — bundled into this same payment if present
}

export default function PaymentModal({
  isOpen,
  onClose,
  plan,
  months = 1,
  discounts = {},
  stbNumber,
  connectionId,
  dueAmount = 0,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [upiOrder, setUpiOrder] = useState<{ orderId: string; upiLink: string; amount: number } | null>(null);
  // The customer's still-running base plan on this connection, if any — a new
  // plan bought now is queued after it, so we say so before they pay.
  const [currentPlan, setCurrentPlan] = useState<{ name: string; expires_at: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const cid = connectionId || (typeof window !== 'undefined' ? localStorage.getItem('ccn_active_cid') : null) || 'primary';
    fetch(`/api/recharge/history${cid !== 'primary' ? `?cid=${encodeURIComponent(cid)}` : ''}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { recharges: [] }))
      .then((d: { recharges?: { plan_name: string; status: string; expires_at: string | null }[] }) => {
        if (cancelled) return;
        const now = Date.now();
        const running = (d.recharges || [])
          .filter((r) => r.status === 'activated' && r.expires_at && new Date(r.expires_at).getTime() > now && !r.plan_name.toUpperCase().startsWith('ALA CARTE'))
          .sort((a, b) => new Date(b.expires_at!).getTime() - new Date(a.expires_at!).getTime())[0];
        setCurrentPlan(running ? { name: running.plan_name, expires_at: running.expires_at! } : null);
      })
      .catch(() => { if (!cancelled) setCurrentPlan(null); });
    return () => { cancelled = true; };
  }, [isOpen, connectionId]);

  if (!isOpen || !plan) return null;

  const resetAndClose = () => {
    setUpiOrder(null);
    onClose();
  };

  const { price: displayPrice, durationDays: displayDurationDays } = calcDurationPricing(
    plan.price,
    plan.duration_days,
    months,
    discounts[months] || 0
  );

  const handlePayment = async () => {
    try {
      setLoading(true);

      const orderResponse = await fetch('/api/recharge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, connectionId: connectionId || 'primary', months }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      if (orderData.payu) {
        // Stays "Processing…" until the overlay reports back — resetting
        // loading early would let this card's "Pay Now" button become
        // clickable again behind the bolt.js overlay.
        await launchPayu(orderData.payu as PayuLaunchParams, () => setLoading(false));
        return;
      }

      setUpiOrder({ orderId: orderData.orderId, upiLink: orderData.upiLink, amount: orderData.amount });
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (upiOrder) {
    return (
      <UpiPaymentModal
        upiLink={upiOrder.upiLink}
        amount={upiOrder.amount}
        submitUtrUrl={`/api/recharge/${upiOrder.orderId}/submit-utr`}
        onSubmitted={() => {
          const orderId = upiOrder.orderId;
          resetAndClose();
          window.location.href = `/dashboard?order_id=${orderId}`;
        }}
        onCancel={resetAndClose}
      />
    );
  }

  const row = (label: string, value: ReactNode, valueClass = 'text-white') => (
    <div className="flex justify-between items-center gap-4 py-2.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm sm:text-base font-semibold text-right break-all ${valueClass}`}>{value}</span>
    </div>
  );

  return (
    <PremiumModal title="Confirm Payment" subtitle="Review your recharge before paying" onClose={onClose} closeDisabled={loading}>
      {currentPlan && (
        <div className="mb-5 rounded-2xl p-4 text-sm"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)' }}>
          <p className="font-bold text-amber-300 mb-1">⚠ You already have an active plan</p>
          <p className="text-xs sm:text-sm leading-relaxed text-amber-100/90">
            <span className="font-semibold text-white">{currentPlan.name}</span> is valid till{' '}
            <span className="font-semibold text-white">{formatDisplayEndDate(currentPlan.expires_at)}</span>.
            This new plan will start automatically on{' '}
            <span className="font-semibold text-white">{formatDateDMY(currentPlan.expires_at)}</span>, after your current plan ends — you will not lose any days.
          </p>
        </div>
      )}

      <div className="rounded-2xl px-4 mb-5 divide-y divide-white/[0.07]"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {row('Plan', `${plan.name}${months > 1 ? ` (${months} Months)` : ''}`)}
        {row('Duration', `${displayDurationDays} days`)}
        {row('STB Number', <span className="font-mono">{stbNumber}</span>)}
        {dueAmount > 0 && row('Plan Amount', formatCurrency(displayPrice))}
        {dueAmount > 0 && row('Outstanding Due', formatCurrency(dueAmount * 100), 'text-red-300')}
      </div>

      <div className="flex justify-between items-end mb-1">
        <span className="text-sm uppercase tracking-wider font-semibold text-gray-400">Total Amount</span>
        <span className="text-3xl font-extrabold text-white">{formatCurrency(displayPrice + dueAmount * 100)}</span>
      </div>
      {dueAmount > 0 && (
        <p className="text-xs text-gray-400 mb-1">Your due amount is included in this payment — both are cleared in a single transaction.</p>
      )}

      <PremiumButton onClick={handlePayment} disabled={loading} className="mt-5">
        {loading ? 'Processing…' : currentPlan ? 'Pay & Queue After Current Plan' : 'Pay Now'}
      </PremiumButton>
      <p className="text-center text-[11px] text-gray-500 mt-3">🔒 Secure payment</p>
    </PremiumModal>
  );
}

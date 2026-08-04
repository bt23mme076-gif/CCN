'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { load } from '@cashfreepayments/cashfree-js';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  channels: string[];
  is_popular: boolean;
}

interface QuickRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'stb' | 'confirm' | 'plan' | 'paying';

export default function QuickRechargeModal({ isOpen, onClose }: QuickRechargeModalProps) {
  const [step, setStep] = useState<Step>('stb');
  const [stbNumber, setStbNumber] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [match, setMatch] = useState<{ name: string; area: string; hasOutstandingBalance: boolean } | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [payingPlanId, setPayingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state each time it's closed so reopening starts fresh
      setStep('stb');
      setStbNumber('');
      setError('');
      setMatch(null);
      setPlans([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckStb = async () => {
    if (!stbNumber.trim()) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/guest/lookup-stb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stb_number: stbNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'STB number not found');
        return;
      }
      setMatch(data);
      setStep('confirm');
    } catch {
      setError('Failed to check STB number. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const proceedToPlans = async () => {
    setStep('plan');
    setPlansLoading(true);
    try {
      const res = await fetch('/api/plans', { cache: 'no-store' });
      const data = await res.json();
      setPlans((data.plans || []).filter((p: Plan) => p.price !== 100));
    } catch {
      setError('Failed to load plans. Please try again.');
    } finally {
      setPlansLoading(false);
    }
  };

  const handlePay = async (planId: string) => {
    setPayingPlanId(planId);
    setError('');
    try {
      const orderRes = await fetch('/api/guest/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stbNumber: stbNumber.trim(), planId, months: 1 }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error || 'Failed to start payment');
        setPayingPlanId(null);
        return;
      }

      const cashfree = await load({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      });
      if (!cashfree) throw new Error('Failed to load Cashfree checkout');

      setStep('paying');
      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_self' as const,
      }).then((result: any) => {
        if (result?.error) {
          console.error('Cashfree checkout error:', result.error);
          setError('Payment failed. Please try again.');
          setStep('plan');
          setPayingPlanId(null);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start payment');
      setPayingPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy">
            Quick Recharge
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 'stb' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Recharge without logging in — bas apna STB (set-top box) number daalein.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">STB Number</label>
              <input
                type="text"
                value={stbNumber}
                onChange={(e) => setStbNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckStb()}
                placeholder="e.g. 100335254726513"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-accent-red text-sm"
                autoFocus
              />
            </div>
            <button
              onClick={handleCheckStb}
              disabled={checking || !stbNumber.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {checking ? 'Checking...' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'confirm' && match && (
          <div className="space-y-4">
            <div className="bg-gray-1 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Is this your connection?</p>
              <p className="font-semibold text-brand-navy">{match.name}</p>
              <p className="text-sm text-gray-600">{match.area}</p>
              <p className="text-xs text-gray-400 mt-1">STB: {stbNumber}</p>
            </div>

            {match.hasOutstandingBalance ? (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                Is connection par outstanding due hai. Kripya login karke pehle due clear karein.
              </div>
            ) : (
              <button
                onClick={proceedToPlans}
                className="btn-primary w-full text-sm sm:text-base"
              >
                Yes, this is correct
              </button>
            )}
            <button
              onClick={() => { setStep('stb'); setMatch(null); setError(''); }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Not you? Try a different STB number
            </button>
          </div>
        )}

        {step === 'plan' && (
          <div className="space-y-3">
            {plansLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No plans available right now.</div>
            ) : (
              plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handlePay(plan.id)}
                  disabled={payingPlanId !== null}
                  className="w-full text-left border border-gray-200 rounded-xl p-4 hover:border-accent-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-brand-navy flex items-center gap-2">
                        {plan.name}
                        {plan.is_popular && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-orange/15 text-accent-orange font-bold">POPULAR</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.duration_days} days</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent-red">{formatCurrency(plan.price)}</p>
                      {payingPlanId === plan.id && <p className="text-xs text-gray-400">Starting...</p>}
                    </div>
                  </div>
                </button>
              ))
            )}
            <button
              onClick={() => setStep('confirm')}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 underline mt-2"
            >
              ← Back
            </button>
          </div>
        )}

        {step === 'paying' && (
          <div className="text-center py-8">
            <div className="w-10 h-10 border-2 border-accent-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600">Redirecting to payment...</p>
          </div>
        )}
      </div>
    </div>
  );
}

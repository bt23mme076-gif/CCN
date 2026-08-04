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

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

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

  const stepIndex = step === 'stb' ? 0 : step === 'confirm' ? 1 : step === 'plan' ? 2 : 3;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="relative max-w-md w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 45%, #0f3460 75%, #302b63 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {/* Glow strip */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
          style={{ background: 'linear-gradient(90deg, transparent, #e63946, #f77f00, #e63946, transparent)' }} />

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-accent-orange mb-1">⚡ No Login Needed</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">Quick Recharge</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 transition-colors flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step progress dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {['STB', 'Confirm', 'Plan', 'Pay'].map((label, i) => (
              <div key={label} className="flex-1 flex items-center gap-1.5">
                <div
                  className="h-1.5 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: i <= stepIndex
                      ? 'linear-gradient(90deg, #e63946, #f77f00)'
                      : 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="rounded-xl p-3.5 mb-5 text-sm text-red-200"
              style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.35)' }}>
              {error}
            </div>
          )}

          {step === 'stb' && (
            <div className="space-y-4">
              <p className="text-sm text-blue-200/80 leading-relaxed">
                Bas apna STB (set-top box) number daalein — payment ke baad turant recharge queue mein chala jayega.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">STB Number</label>
                <input
                  type="text"
                  value={stbNumber}
                  onChange={(e) => setStbNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckStb()}
                  placeholder="e.g. 100335254726513"
                  className="w-full px-4 py-3.5 rounded-xl text-white placeholder-gray-500 text-sm outline-none transition-all font-mono tracking-wide"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(230,57,70,0.6)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                  autoFocus
                />
              </div>
              <button
                onClick={handleCheckStb}
                disabled={checking || !stbNumber.trim()}
                className="btn-gradient w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-3.5"
              >
                {checking ? 'Checking...' : 'Continue →'}
              </button>
            </div>
          )}

          {step === 'confirm' && match && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-300/70 mb-3">Is this your connection?</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                    {getInitials(match.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-lg truncate">{match.name}</p>
                    <p className="text-sm text-blue-200/80 truncate">{match.area}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 flex items-center justify-between text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span className="text-gray-400">STB Number</span>
                  <span className="text-gray-200 font-mono">{stbNumber}</span>
                </div>
              </div>

              {match.hasOutstandingBalance ? (
                <div className="rounded-xl p-4 text-sm text-yellow-100"
                  style={{ background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.35)' }}>
                  ⚠️ Is connection par outstanding due hai. Kripya login karke pehle due clear karein.
                </div>
              ) : (
                <button onClick={proceedToPlans} className="btn-gradient w-full text-sm sm:text-base py-3.5">
                  Yes, this is correct →
                </button>
              )}
              <button
                onClick={() => { setStep('stb'); setMatch(null); setError(''); }}
                className="w-full text-center text-sm text-blue-300/70 hover:text-white transition-colors"
              >
                Not you? Try a different STB number
              </button>
            </div>
          )}

          {step === 'plan' && (
            <div className="space-y-3">
              {plansLoading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-10 text-blue-200/60 text-sm">No plans available right now.</div>
              ) : (
                plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handlePay(plan.id)}
                    disabled={payingPlanId !== null}
                    className="w-full text-left rounded-2xl p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                    style={{
                      background: plan.is_popular
                        ? 'linear-gradient(135deg, rgba(230,57,70,0.18), rgba(247,127,0,0.12))'
                        : 'rgba(255,255,255,0.05)',
                      border: plan.is_popular ? '1px solid rgba(247,127,0,0.4)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-white flex items-center gap-2 flex-wrap">
                          {plan.name}
                          {plan.is_popular && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black tracking-wide"
                              style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)', color: 'white' }}>
                              POPULAR
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-blue-300/70 mt-1">{plan.duration_days} days validity</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-lg text-transparent bg-clip-text"
                          style={{ backgroundImage: 'linear-gradient(90deg, #ff8fa3, #ffb703)' }}>
                          {formatCurrency(plan.price)}
                        </p>
                        {payingPlanId === plan.id && <p className="text-[11px] text-gray-400">Starting...</p>}
                      </div>
                    </div>
                  </button>
                ))
              )}
              <button
                onClick={() => setStep('confirm')}
                className="w-full text-center text-sm text-blue-300/70 hover:text-white transition-colors mt-2"
              >
                ← Back
              </button>
            </div>
          )}

          {step === 'paying' && (
            <div className="text-center py-10">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-blue-200/80">Redirecting to payment...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

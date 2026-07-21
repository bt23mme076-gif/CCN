'use client';

import { useEffect, useRef, useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';

interface FastRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentSessionId: string;
  amount: number;
  fallbackUpiLink: string;
}

const UPI_APPS = [
  { key: 'gpay',    label: 'Google Pay', bg: 'linear-gradient(135deg,#e8f0fe,#fff)', border: '#4285F4' },
  { key: 'phonepe', label: 'PhonePe',    bg: 'linear-gradient(135deg,#f0e8ff,#fff)', border: '#5f259f' },
  { key: 'paytm',   label: 'Paytm',      bg: 'linear-gradient(135deg,#e0f7ff,#fff)', border: '#00BAF2' },
  { key: 'default', label: 'Other UPI',  bg: 'linear-gradient(135deg,#fff8e8,#fff)', border: '#f5a623' },
] as const;

export default function FastRechargeModal({ isOpen, onClose, paymentSessionId, amount, fallbackUpiLink }: FastRechargeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const componentRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!isOpen || !paymentSessionId) return;
    setError('');
    setMounted(false);

    (async () => {
      try {
        const cashfree = await load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
        });
        if (!cashfree) { setError('fallback'); return; }
        const cf = cashfree as any;

        for (const app of UPI_APPS) {
          try {
            const component = cf.create('upiApp', {
              values: { upiApp: app.key, buttonText: `Pay with ${app.label}`, buttonIcon: true },
            });
            component.on('loaderror', () => setError('fallback'));
            component.on('click', () => {
              cf.pay({
                paymentMethod: component,
                paymentSessionId,
                returnUrl: `${window.location.origin}/dashboard`,
              }).catch(() => setError('fallback'));
            });
            component.mount(`#upi-btn-${app.key}`);
            componentRefs.current[app.key] = component;
          } catch { /* skip */ }
        }
        setMounted(true);
      } catch {
        setError('fallback');
      }
    })();

    return () => {
      Object.values(componentRefs.current).forEach((c: any) => { try { c.unmount?.(); } catch { } });
      componentRefs.current = {};
    };
  }, [isOpen, paymentSessionId]);

  if (!isOpen) return null;

  const amountRs = (amount / 100).toFixed(0);

  if (error === 'fallback') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
        <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 pt-8 pb-6 text-center" style={{ background: 'linear-gradient(135deg,#1a0533,#0f0c29)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#e94560,#f5a623)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-xl mb-1">Fast Recharge</h2>
            <p className="text-3xl font-extrabold text-white mb-1">₹{amountRs}</p>
            <p className="text-blue-300 text-sm">Tap below to pay via UPI</p>
          </div>
          <div className="bg-white px-6 py-6 space-y-3">
            <a href={fallbackUpiLink}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg,#e94560,#f5a623)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Pay ₹{amountRs} via UPI
            </a>
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium border border-gray-100">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="relative px-6 pt-8 pb-6" style={{ background: 'linear-gradient(135deg,#1a0533,#0f0c29)' }}>
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
            ✕
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#e94560,#f5a623)' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-blue-300 text-xs uppercase tracking-widest font-semibold mb-0.5">Fast Recharge</p>
              <p className="text-white text-3xl font-extrabold">₹{amountRs}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <p className="text-blue-300 text-xs">Choose your UPI app</p>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>

        {/* UPI Options */}
        <div className="bg-white px-4 pt-4 pb-6 space-y-2.5">
          {!mounted ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#e94560', borderTopColor: 'transparent' }} />
              <span className="text-gray-400 text-sm">Loading payment options...</span>
            </div>
          ) : null}

          {UPI_APPS.map(app => (
            <div key={app.key}
              className="rounded-2xl overflow-hidden transition-all active:scale-95"
              style={{ background: app.bg, border: `1.5px solid ${app.border}22` }}>
              <div id={`upi-btn-${app.key}`} className="w-full [&>*]:w-full [&>button]:w-full [&>button]:py-4 [&>button]:font-semibold [&>button]:text-base" />
            </div>
          ))}

          <button onClick={onClose}
            className="w-full mt-1 py-3 rounded-2xl text-gray-400 text-sm font-medium border border-gray-100 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

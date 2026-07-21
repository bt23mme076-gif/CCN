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
  { key: 'gpay', label: 'Google Pay', color: '#4285F4', emoji: '🔵' },
  { key: 'phonepe', label: 'PhonePe', color: '#5f259f', emoji: '🟣' },
  { key: 'paytm', label: 'Paytm', color: '#00BAF2', emoji: '🔷' },
  { key: 'default', label: 'Other UPI', color: '#f5a623', emoji: '💳' },
] as const;

export default function FastRechargeModal({ isOpen, onClose, paymentSessionId, amount, fallbackUpiLink }: FastRechargeModalProps) {
  const [mounted, setMounted] = useState<string | null>(null);
  const [error, setError] = useState('');
  const componentRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!isOpen || !paymentSessionId) return;
    setError('');
    setMounted(null);

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
            component.on('loaderror', () => {
              setError('fallback');
            });
            component.on('click', () => {
              cf.pay({
                paymentMethod: component,
                paymentSessionId,
                returnUrl: `${window.location.origin}/dashboard`,
              }).catch(() => setError('fallback'));
            });
            component.mount(`#upi-btn-${app.key}`);
            componentRefs.current[app.key] = component;
          } catch { /* skip this app */ }
        }
        setMounted('done');
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

  // Fallback: direct UPI link
  if (error === 'fallback') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl">
          <p className="text-2xl mb-2">💳</p>
          <h2 className="font-bold text-lg text-gray-800 mb-1">Fast Recharge — ₹{amountRs}</h2>
          <p className="text-gray-500 text-sm mb-4">Tap below to open your UPI app</p>
          <a
            href={fallbackUpiLink}
            className="block w-full py-3 rounded-xl font-bold text-white text-center"
            style={{ background: 'linear-gradient(135deg, #e94560, #f5a623)' }}
          >
            Pay ₹{amountRs} via UPI
          </a>
          <button onClick={onClose} className="mt-3 text-gray-400 text-sm">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-lg text-gray-800">Fast Recharge</h2>
            <p className="text-gray-500 text-sm">₹{amountRs} — Choose UPI app</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        <div className="space-y-2">
          {UPI_APPS.map(app => (
            <div key={app.key} id={`upi-btn-${app.key}`} className="w-full min-h-[48px]" />
          ))}
        </div>

        {!mounted && (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e94560', borderTopColor: 'transparent' }} />
            <span className="ml-2 text-sm text-gray-400">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}

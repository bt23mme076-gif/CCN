'use client';

import { useEffect, useRef, useState } from 'react';
import { load } from '@cashfreepayments/cashfree-js';

interface FastRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentSessionId: string;
  orderId: string;
  amount: number;
  fallbackUpiLink: string;
}

const UPI_APPS = [
  { key: 'phonepe', label: 'PhonePe' },
  { key: 'gpay',    label: 'Google Pay' },
  { key: 'default', label: 'Any UPI' },
] as const;

export default function FastRechargeModal({ isOpen, onClose, paymentSessionId, orderId, amount, fallbackUpiLink }: FastRechargeModalProps) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [paymentFailed, setPaymentFailed] = useState(false);
  const componentRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!isOpen || !paymentSessionId) return;
    setError('');
    setReady(false);

    (async () => {
      try {
        const cashfree = await load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
        });
        if (!cashfree) { setError('fallback'); return; }
        const cf = cashfree as any;

        (window as any).__cashfreeUpiResult = (resultCode: number) => {
          if (resultCode === -1) {
            window.location.href = `${window.location.origin}/dashboard?order_id=${orderId}`;
          } else {
            setPaymentFailed(true);
          }
        };

        for (const app of UPI_APPS) {
          try {
            const component = cf.create('upiApp', {
              values: { upiApp: app.key, buttonText: app.label, buttonIcon: true },
            });
            component.on('loaderror', () => {});
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
        setReady(true);
      } catch {
        setError('fallback');
      }
    })();

    return () => {
      delete (window as any).__cashfreeUpiResult;
      Object.values(componentRefs.current).forEach((c: any) => { try { c.unmount?.(); } catch { } });
      componentRefs.current = {};
    };
  }, [isOpen, paymentSessionId]);

  if (!isOpen) return null;

  const amountRs = (amount / 100).toFixed(0);

  if (paymentFailed) {
    setTimeout(() => { window.location.href = window.location.origin; }, 10000);
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Fast Recharge</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-0.5">₹{amountRs}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 text-base mb-1">Payment नहीं हुआ</p>
              <p className="text-sm text-gray-500">दोबारा try करें। अगर amount deduct हो गया है तो अपने operator से contact करें।</p>
            </div>
            <button
              onClick={() => setPaymentFailed(false)}
              className="flex items-center justify-center w-full py-3.5 rounded-2xl font-bold text-white text-base"
              style={{ background: '#1a1a40' }}>
              दोबारा Try करें
            </button>
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'fallback') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Fast Recharge</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-0.5">₹{amountRs}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
          </div>
          <div className="p-4 space-y-3">
            <a href={fallbackUpiLink}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-base"
              style={{ background: '#1a7a4a' }}>
              Pay ₹{amountRs} via UPI
            </a>
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Fast Recharge</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">₹{amountRs}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ✕
          </button>
        </div>

        {/* Pay Via UPI label */}
        <p className="px-5 pt-4 pb-3 text-base font-bold text-gray-800 flex-shrink-0">Pay Via UPI</p>

        {/* Cashfree UPI buttons — real icons rendered by Cashfree */}
        <div className="px-4 pb-2 space-y-2 overflow-y-auto flex-1 min-h-0">
          {!ready ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-blue-500" />
              <span className="text-gray-400 text-sm">Loading payment options...</span>
            </div>
          ) : null}

          {UPI_APPS.map(app => (
            <div key={app.key}
              className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
              style={{ display: ready ? 'block' : 'none' }}>
              <div id={`upi-btn-${app.key}`} />
            </div>
          ))}
        </div>

        {/* Cancel */}
        <div className="px-4 pt-1 pb-5 flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

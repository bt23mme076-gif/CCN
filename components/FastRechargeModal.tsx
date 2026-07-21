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
  {
    key: 'gpay',
    label: 'Google Pay',
    color: '#4285F4',
    bg: '#E8F0FE',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <path fill="#4285F4" d="M43.6 20.1H24v7.8h11.2c-1 5.2-5.5 8.1-11.2 8.1C17.3 36 12 30.7 12 24s5.3-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.8 6.5 29.2 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5c11 0 20-8 20-20.5 0-1.3-.1-2.6-.4-3.9z"/>
        <path fill="#34A853" d="M6.3 14.7l6.6 4.8C14.5 15.5 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.8 6.5 29.2 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"/>
        <path fill="#FBBC05" d="M24 45.5c5.1 0 9.7-1.9 13.2-5l-6.1-5.1C29.2 36.7 26.7 37.5 24 37.5c-5.7 0-10.1-3.8-11.1-8.8l-6.6 5.1C9.7 40.8 16.4 45.5 24 45.5z"/>
        <path fill="#EA4335" d="M43.6 20.1H24v7.8h11.2c-.5 2.5-1.8 4.6-3.8 6l6.1 5.1C40.9 35.6 44 30.5 44 24.5c0-1.3-.1-2.6-.4-3.9v-.5z"/>
      </svg>
    ),
  },
  {
    key: 'phonepe',
    label: 'PhonePe',
    color: '#5f259f',
    bg: '#EDE7F6',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <rect width="48" height="48" rx="12" fill="#5f259f"/>
        <text x="24" y="32" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">Pe</text>
      </svg>
    ),
  },
  {
    key: 'paytm',
    label: 'Paytm',
    color: '#00BAF2',
    bg: '#E0F7FF',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <rect width="48" height="48" rx="12" fill="#00BAF2"/>
        <text x="24" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">PAYTM</text>
      </svg>
    ),
  },
  {
    key: 'default',
    label: 'Any UPI',
    color: '#1a7a4a',
    bg: '#E8F5E9',
    svg: (
      <svg viewBox="0 0 48 48" className="w-10 h-10">
        <rect width="48" height="48" rx="12" fill="#1a7a4a"/>
        <text x="24" y="33" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial">₹</text>
      </svg>
    ),
  },
] as const;

export default function FastRechargeModal({ isOpen, onClose, paymentSessionId, amount, fallbackUpiLink }: FastRechargeModalProps) {
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const componentRefs = useRef<Record<string, any>>({});
  const cfRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !paymentSessionId) return;
    setError('');
    setReady(false);
    cfRef.current = null;

    (async () => {
      try {
        const cashfree = await load({
          mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
        });
        if (!cashfree) { setError('fallback'); return; }
        const cf = cashfree as any;
        cfRef.current = cf;

        (window as any).__cashfreeUpiResult = (resultCode: number) => {
          setPaying(null);
          if (resultCode === -1) {
            window.location.href = `${window.location.origin}/dashboard`;
          }
        };

        for (const app of UPI_APPS) {
          try {
            const component = cf.create('upiApp', {
              values: { upiApp: app.key },
            });
            component.on('loaderror', () => {});
            // Mount hidden — we use our own buttons for UI
            const el = document.getElementById(`upi-hidden-${app.key}`);
            if (el) component.mount(`#upi-hidden-${app.key}`);
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
      cfRef.current = null;
    };
  }, [isOpen, paymentSessionId]);

  const handlePay = (appKey: string) => {
    if (paying || !cfRef.current || !componentRefs.current[appKey]) return;
    setPaying(appKey);
    cfRef.current.pay({
      paymentMethod: componentRefs.current[appKey],
      paymentSessionId,
      returnUrl: `${window.location.origin}/dashboard`,
    }).catch(() => {
      setPaying(null);
      setError('fallback');
    });
  };

  if (!isOpen) return null;

  const amountRs = (amount / 100).toFixed(0);

  // Hidden mount targets for Cashfree components
  const hiddenMounts = (
    <div className="hidden" aria-hidden="true">
      {UPI_APPS.map(app => (
        <div key={app.key} id={`upi-hidden-${app.key}`} />
      ))}
    </div>
  );

  if (error === 'fallback') {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
        {hiddenMounts}
        <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Fast Recharge</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">₹{amountRs}</p>
          </div>
          <div className="p-4 space-y-3">
            <a href={fallbackUpiLink}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-white text-base"
              style={{ background: '#1a7a4a' }}>
              ₹ Pay ₹{amountRs} via UPI
            </a>
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      {hiddenMounts}
      <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Fast Recharge</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-0.5">₹{amountRs}</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-lg font-medium">
            ✕
          </button>
        </div>

        {/* Title */}
        <p className="px-5 pt-4 pb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Pay Via UPI
        </p>

        {/* UPI App Grid */}
        <div className="px-4 pb-2">
          {!ready ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-blue-500" />
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {UPI_APPS.map(app => (
                <button
                  key={app.key}
                  onClick={() => handlePay(app.key)}
                  disabled={!!paying}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: app.bg, borderColor: paying === app.key ? app.color : `${app.color}33` }}
                >
                  {paying === app.key ? (
                    <div className="w-10 h-10 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: app.color, borderTopColor: 'transparent' }} />
                    </div>
                  ) : (
                    app.svg
                  )}
                  <span className="font-bold text-sm" style={{ color: app.color }}>
                    {app.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cancel */}
        <div className="px-4 pt-2 pb-5">
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

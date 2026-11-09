'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { PremiumModal, PremiumButton, accentGradient } from '@/components/PortalUI';
import { toUpiAppLink } from '@/lib/payments/upi';

interface UpiPaymentModalProps {
  upiLink: string;
  amount: number; // paise — order price; the link may carry a few extra unique paise
  submitUtrUrl: string;
  onSubmitted: () => void;
  onCancel: () => void;
  title?: string;
}

type Platform = 'android' | 'ios' | 'desktop';
type VerifyState = 'waiting' | 'paid' | 'manual'; // manual = auto-verify unavailable for this order

const FALLBACK_AFTER_MS = 120_000;

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'desktop';
}

const rupees = (paise: number) => `₹${(paise / 100).toFixed(paise % 100 ? 2 : 0)}`;

export default function UpiPaymentModal({
  upiLink,
  amount,
  submitUtrUrl,
  onSubmitted,
  onCancel,
  title = 'Pay via UPI',
}: UpiPaymentModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [showQr, setShowQr] = useState(false);
  const [state, setState] = useState<VerifyState>('waiting');
  const [showFallback, setShowFallback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const autoOpened = useRef(false);

  const params = new URLSearchParams(upiLink.split('?')[1] ?? '');
  const upiId = params.get('pa') ?? '';
  const payAmount = Math.round(parseFloat(params.get('am') ?? '') * 100) || amount;
  const extraPaise = payAmount - amount;
  // Every caller passes /api/<kind>/<orderId>/submit-utr.
  const orderId = submitUtrUrl.match(/\/api\/[^/]+\/([^/]+)\/submit-utr/)?.[1] ?? '';

  useEffect(() => {
    QRCode.toDataURL(upiLink, { width: 240, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, [upiLink]);

  // Android: open the UPI app chooser straight away — the customer only enters their PIN.
  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    if (p === 'android' && !autoOpened.current) {
      autoOpened.current = true;
      window.location.href = upiLink;
    }
  }, [upiLink]);

  // Poll for the bank-verified payment, and check immediately when the customer returns from the UPI app.
  useEffect(() => {
    if (!orderId || state !== 'waiting') return;
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(`/api/upi/status/${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const { status } = await res.json();
        if (stopped) return;
        if (status === 'paid') setState('paid');
        else if (status === 'none') setState('manual');
      } catch {
        // network blip — next tick retries
      }
    };
    check();
    const poll = setInterval(check, 3000);
    const fallback = setTimeout(() => setShowFallback(true), FALLBACK_AFTER_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      stopped = true;
      clearInterval(poll);
      clearTimeout(fallback);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [orderId, state]);

  // Callers pass an inline onSubmitted; keep the latest in a ref so re-renders don't restart the timer.
  const onSubmittedRef = useRef(onSubmitted);
  onSubmittedRef.current = onSubmitted;
  useEffect(() => {
    if (state !== 'paid') return;
    const t = setTimeout(() => onSubmittedRef.current(), 1500);
    return () => clearTimeout(t);
  }, [state]);

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing we can do silently.
    }
  };

  // Fallback: customer says they paid but the bank message hasn't arrived — admin verifies, as before.
  const handleClaimPaid = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(submitUtrUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utr: 'N/A' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const box = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const appButton = 'block text-center py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors';

  if (state === 'paid') {
    return (
      <PremiumModal title="Payment received" onClose={onSubmitted}>
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{ background: 'rgba(74,222,128,0.15)', border: '2px solid #4ade80', color: '#4ade80' }}>
            ✓
          </div>
          <p className="text-3xl font-extrabold text-white">{rupees(payAmount)}</p>
          <p className="text-sm text-gray-400 mt-2">Verified with the bank. Taking you to your order…</p>
        </div>
      </PremiumModal>
    );
  }

  const showQrCode = platform === 'desktop' || showQr;

  return (
    <PremiumModal title={title} subtitle={platform === 'desktop' ? 'Scan with any UPI app' : 'Pay with your UPI app'} onClose={onCancel} closeDisabled={submitting}>
      <div className="text-center mb-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Amount to pay</p>
        <p className="text-4xl font-extrabold text-white">{rupees(payAmount)}</p>
        {extraPaise > 0 && extraPaise < 100 && (
          <p className="text-[11px] text-amber-300/90 mt-1.5">
            {rupees(amount)} + {extraPaise} paise so your payment is confirmed instantly. Please don&apos;t change the amount.
          </p>
        )}
      </div>

      {platform === 'android' && !showQr && (
        <a href={upiLink} className="block w-full text-center py-3.5 mb-3 rounded-xl font-bold text-white"
          style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
          Open UPI App
        </a>
      )}

      {platform !== 'desktop' && !showQr && (
        <div className={`grid gap-2 mb-3 ${platform === 'ios' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <a href={toUpiAppLink(upiLink, 'gpay')} className={appButton} style={box}>GPay</a>
          <a href={toUpiAppLink(upiLink, 'phonepe')} className={appButton} style={box}>PhonePe</a>
          {platform === 'android' && <a href={toUpiAppLink(upiLink, 'paytm')} className={appButton} style={box}>Paytm</a>}
        </div>
      )}

      {showQrCode && (
        <div className="flex justify-center mb-4">
          {qrDataUrl ? (
            <div className="p-3 bg-white rounded-2xl" style={{ boxShadow: '0 0 0 4px rgba(245,210,122,0.25), 0 12px 40px rgba(0,0,0,0.4)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="UPI QR Code" className="w-44 h-44 sm:w-48 sm:h-48" />
            </div>
          ) : (
            <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl flex items-center justify-center text-gray-400 text-sm" style={box}>
              Loading QR…
            </div>
          )}
        </div>
      )}

      {platform !== 'desktop' && (
        <button type="button" onClick={() => setShowQr(!showQr)}
          className="block w-full text-center text-xs font-semibold text-[#f5d27a] mb-4">
          {showQr ? '← Back to UPI apps' : 'Pay from another phone (show QR code)'}
        </button>
      )}

      {showQrCode && upiId && (
        <div className="flex items-center justify-between gap-2 mb-4 px-3.5 py-2.5 rounded-xl" style={box}>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">UPI ID</p>
            <p className="text-sm font-semibold text-white truncate font-mono">{upiId}</p>
          </div>
          <button type="button" onClick={handleCopyUpiId}
            className="flex-shrink-0 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
            style={copied
              ? { color: '#4ade80', border: '1px solid rgba(74,222,128,0.5)' }
              : { color: '#f5d27a', border: '1px solid rgba(245,210,122,0.5)' }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}

      {state === 'waiting' && (
        <div className="flex items-center justify-center gap-2.5 rounded-xl px-3.5 py-3 mb-4 text-xs text-gray-300"
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          Waiting for payment — this confirms automatically
        </div>
      )}

      {error && <p className="text-sm text-red-300 text-center mb-3">{error}</p>}

      {(state === 'manual' || showFallback) && (
        <>
          {state === 'waiting' && (
            <p className="text-xs text-gray-400 text-center mb-2">Already paid? It can take a few minutes to confirm.</p>
          )}
          <PremiumButton onClick={handleClaimPaid} disabled={submitting}>
            {submitting ? 'Submitting…' : state === 'manual' ? 'Confirm Payment' : "I've already paid"}
          </PremiumButton>
          {state === 'manual' && (
            <p className="text-[11px] text-amber-300 text-center mt-2">Tap only after your UPI payment succeeds.</p>
          )}
        </>
      )}
    </PremiumModal>
  );
}

'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatCurrency } from '@/lib/utils';
import { PremiumModal, PremiumButton } from '@/components/PortalUI';

interface UpiPaymentModalProps {
  upiLink: string;
  amount: number; // paise
  submitUtrUrl: string;
  onSubmitted: () => void;
  onCancel: () => void;
  title?: string;
}

export default function UpiPaymentModal({
  upiLink,
  amount,
  submitUtrUrl,
  onSubmitted,
  onCancel,
  title = 'Pay via Scan & Confirm',
}: UpiPaymentModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const upiId = new URLSearchParams(upiLink.split('?')[1] ?? '').get('pa') ?? '';

  useEffect(() => {
    QRCode.toDataURL(upiLink, { width: 240, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, [upiLink]);

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing we can do silently.
    }
  };

  const handleSubmit = async () => {
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

  return (
    <PremiumModal title={title} subtitle="Scan with any UPI app" onClose={onCancel} closeDisabled={submitting}>
      <div className="text-center mb-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Amount to pay</p>
        <p className="text-4xl font-extrabold text-white">{formatCurrency(amount)}</p>
      </div>

      <div className="flex justify-center mb-4">
        {qrDataUrl ? (
          <div className="p-3 bg-white rounded-2xl" style={{ boxShadow: '0 0 0 4px rgba(245,210,122,0.25), 0 12px 40px rgba(0,0,0,0.4)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="UPI QR Code" className="w-44 h-44 sm:w-48 sm:h-48" />
          </div>
        ) : (
          <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-2xl flex items-center justify-center text-gray-400 text-sm"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Loading QR…
          </div>
        )}
      </div>

      {upiId && (
        <div className="flex items-center justify-between gap-2 mb-3 px-3.5 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
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

      {qrDataUrl && (
        <a href={qrDataUrl} download="upi-qr-code.png"
          className="block w-full text-center mb-4 text-sm font-semibold py-2.5 rounded-xl text-gray-200 hover:bg-white/5 transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.14)' }}>
          ⬇ Download QR Code
        </a>
      )}

      <div className="rounded-xl px-3.5 py-3 mb-4 text-xs leading-relaxed text-gray-300"
        style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
        <p className="mb-1"><span className="font-bold text-white">1.</span> Scan the QR or use the UPI ID to pay {formatCurrency(amount)}.</p>
        <p><span className="font-bold text-white">2.</span> Tap <span className="font-bold text-white">Confirm Payment</span> — <span className="font-bold text-amber-300">only after</span> your UPI payment succeeds.</p>
      </div>

      {error && <p className="text-sm text-red-300 text-center mb-3">{error}</p>}

      <PremiumButton onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting…' : 'Confirm Payment'}
      </PremiumButton>
    </PremiumModal>
  );
}

'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatCurrency } from '@/lib/utils';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-display text-lg sm:text-xl font-bold text-brand-navy">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1" disabled={submitting}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-center font-bold text-base sm:text-lg text-brand-navy mb-2">
          Amount: {formatCurrency(amount)}
        </p>

        <div className="flex justify-center mb-2">
          {qrDataUrl ? (
            <div className="p-2 bg-white rounded-xl shadow-md border">
              <img src={qrDataUrl} alt="UPI QR Code" className="w-36 h-36 sm:w-40 sm:h-40" />
            </div>
          ) : (
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg border flex items-center justify-center text-gray-400 text-sm">
              Loading QR…
            </div>
          )}
        </div>

        {upiId && (
          <div className="flex items-center justify-between gap-2 mb-2 px-2.5 py-1.5 rounded-lg border bg-gray-50">
            <p className="text-xs font-medium text-brand-navy truncate">{upiId}</p>
            <button
              type="button"
              onClick={handleCopyUpiId}
              className="flex-shrink-0 text-xs font-medium text-brand-navy border border-brand-navy rounded-md px-2.5 py-1 hover:bg-brand-navy hover:text-white transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}

        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download="upi-qr-code.png"
            className="btn-outline w-full text-center block mb-2 text-xs sm:text-sm py-2"
          >
            Download QR Code
          </a>
        )}

        <p className="text-xs text-gray-600 mb-3">
          Scan the QR (or use the UPI ID above) to pay {formatCurrency(amount)}, then tap Confirm Payment below.
          <span className="font-bold text-brand-navy"> Confirm only after</span> your UPI payment succeeds.
        </p>

        {error && <p className="text-sm text-accent-red text-center mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50 text-sm sm:text-base"
        >
          {submitting ? 'Submitting...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );
}

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
  title = 'Pay via UPI',
}: UpiPaymentModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    QRCode.toDataURL(upiLink, { width: 240, margin: 1 }).then(setQrDataUrl).catch(() => {});
  }, [upiLink]);

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
      <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1" disabled={submitting}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-center font-bold text-xl sm:text-2xl text-accent-red mb-4">
          {formatCurrency(amount)}
        </p>

        <div className="flex items-start gap-2 mb-2">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
          <p className="text-sm font-medium text-brand-navy">Neeche diye QR code ko apne UPI app (GPay/PhonePe/Paytm) se scan karke payment karein</p>
        </div>

        <div className="flex justify-center mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="UPI QR Code" className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg border" />
          ) : (
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg border flex items-center justify-center text-gray-400 text-sm">
              Loading QR…
            </div>
          )}
        </div>

        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download="upi-qr-code.png"
            className="w-full text-center block mb-4 text-xs sm:text-sm text-brand-navy underline"
          >
            Download QR Code
          </a>
        )}

        <div className="flex items-start gap-2 mb-4 pt-3 border-t">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
          <p className="text-sm font-medium text-brand-navy">Payment complete hone ke baad, yahan wapas aakar neeche "Confirm Payment" button dabayein</p>
        </div>

        {error && <p className="text-sm text-accent-red text-center mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-50 text-sm sm:text-base"
        >
          {submitting ? 'Submitting...' : 'Confirm Payment'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Sirf payment karne ke baad hi "Confirm Payment" dabayein — recharge admin verify karne ke baad activate hoga.
        </p>
      </div>
    </div>
  );
}

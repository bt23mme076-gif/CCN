'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { formatCurrency } from '@/lib/utils';
import { toUpiAppLink, type UpiApp } from '@/lib/payments/upi';

const PAY_APPS: { app: UpiApp; label: string }[] = [
  { app: 'gpay', label: 'Pay with Google Pay' },
  { app: 'phonepe', label: 'Pay with PhonePe' },
  { app: 'paytm', label: 'Pay with Paytm' },
  { app: 'any', label: 'Pay with another UPI app' },
];

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
  // UPI intent links only resolve on a phone; desktop browsers just error out,
  // so they keep the QR code as the primary path.
  const [isMobile, setIsMobile] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

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

        {isMobile && (
          <div className="space-y-2 mb-4">
            {PAY_APPS.map(({ app, label }) => (
              <a
                key={app}
                href={toUpiAppLink(upiLink, app)}
                className="btn-primary w-full text-center block text-sm sm:text-base"
              >
                {label}
              </a>
            ))}
            <p className="text-xs text-gray-500 text-center pt-1">
              The app opens with the amount already filled in. Just enter your UPI PIN,
              then come back here and tap Confirm Payment.
            </p>
          </div>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className="w-full text-center text-sm text-brand-navy underline mb-4"
          >
            {showQr ? 'Hide QR code' : 'Or scan a QR code instead'}
          </button>
        )}

        {(!isMobile || showQr) && (
          <>
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
                className="btn-primary w-full text-center block mb-4 text-sm sm:text-base"
              >
                Download QR Code
              </a>
            )}

            <p className="text-xs sm:text-sm text-gray-500 text-center mb-4">
              Scan the QR code using your UPI app and confirm the payment.
            </p>
          </>
        )}

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

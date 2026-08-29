'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';
import UpiPaymentModal from '@/components/UpiPaymentModal';

interface Accessory {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface AccessoryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: Accessory | null;
  stbNumber: string;
  customerName?: string;
  customerMobile?: string;
}

export default function AccessoryPaymentModal({
  isOpen,
  onClose,
  accessory,
  stbNumber,
}: AccessoryPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [upiOrder, setUpiOrder] = useState<{ orderId: string; upiLink: string; amount: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { t } = useTranslation();

  if (!isOpen || !accessory) return null;

  const resetAndClose = () => {
    setUpiOrder(null);
    onClose();
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      const orderResponse = await fetch('/api/accessory/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessoryId: accessory.id }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      setUpiOrder({ orderId: orderData.orderId, upiLink: orderData.upiLink, amount: orderData.amount });
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (upiOrder) {
    if (showSuccess) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-2">
                Payment Submitted!
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                We've received your payment details. Your operator will deliver the accessory once verified.
              </p>

              <div className="bg-gray-1 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
                <div className="flex justify-between mb-2 text-sm sm:text-base">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium text-xs sm:text-sm break-all ml-2">{upiOrder.orderId}</span>
                </div>
                <div className="flex justify-between mb-2 text-sm sm:text-base">
                  <span className="text-gray-600">{t('accessory')}:</span>
                  <span className="font-medium">{accessory.name}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-success">{formatCurrency(upiOrder.amount)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  resetAndClose();
                  window.location.reload();
                }}
                className="btn-primary w-full text-sm sm:text-base"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <UpiPaymentModal
        upiLink={upiOrder.upiLink}
        amount={upiOrder.amount}
        submitUtrUrl={`/api/accessory/${upiOrder.orderId}/submit-utr`}
        onSubmitted={() => setShowSuccess(true)}
        onCancel={resetAndClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy">
            {t('confirmOrder')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={loading}
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">{t('accessory')}:</span>
            <span className="font-medium">{accessory.name}</span>
          </div>
          {accessory.description && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              {accessory.description}
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">STB Number:</span>
            <span className="font-medium break-all">{stbNumber}</span>
          </div>
          <div className="flex justify-between text-base sm:text-lg font-bold pt-3 sm:pt-4 border-t">
            <span>{t('totalAmount')}:</span>
            <span className="text-accent-red">{formatCurrency(accessory.price)}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {loading ? 'Processing...' : t('payWithCashfree')}
        </button>
      </div>
    </div>
  );
}

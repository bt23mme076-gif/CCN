'use client';

import { useState } from 'react';
import { formatCurrency, isInAppBrowser, openInExternalBrowser } from '@/lib/utils';
import { calcDurationPricing } from '@/lib/planDuration';
import UpiPaymentModal from '@/components/UpiPaymentModal';
import { launchPayu, PayuLaunchParams } from '@/lib/payments/payuClient';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number;
  } | null;
  months?: number;
  discounts?: Record<number, number>;
  stbNumber: string;
  customerName?: string;
  customerMobile?: string;
  connectionId?: string;
  dueAmount?: number; // customer's current outstanding due, in rupees — bundled into this same payment if present
}

export default function PaymentModal({
  isOpen,
  onClose,
  plan,
  months = 1,
  discounts = {},
  stbNumber,
  connectionId,
  dueAmount = 0,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [upiOrder, setUpiOrder] = useState<{ orderId: string; upiLink: string; amount: number } | null>(null);
  const inAppBrowser = isInAppBrowser();

  if (!isOpen || !plan) return null;

  const resetAndClose = () => {
    setUpiOrder(null);
    onClose();
  };

  const { price: displayPrice, durationDays: displayDurationDays } = calcDurationPricing(
    plan.price,
    plan.duration_days,
    months,
    discounts[months] || 0
  );

  const handlePayment = async () => {
    try {
      setLoading(true);

      const orderResponse = await fetch('/api/recharge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, connectionId: connectionId || 'primary', months }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      if (orderData.payu) {
        await launchPayu(orderData.payu as PayuLaunchParams, () => setLoading(false));
        return;
      }

      setUpiOrder({ orderId: orderData.orderId, upiLink: orderData.upiLink, amount: orderData.amount });
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (upiOrder) {
    return (
      <UpiPaymentModal
        upiLink={upiOrder.upiLink}
        amount={upiOrder.amount}
        submitUtrUrl={`/api/recharge/${upiOrder.orderId}/submit-utr`}
        onSubmitted={() => {
          const orderId = upiOrder.orderId;
          resetAndClose();
          window.location.href = `/dashboard?order_id=${orderId}`;
        }}
        onCancel={resetAndClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy">
            Confirm Payment
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

        {inAppBrowser && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4 text-sm text-yellow-800">
            <strong>PhonePe/GPay buttons kaam nahi karenge</strong> is browser mein.<br />
            <button
              className="underline font-medium mt-1 inline-block"
              onClick={() => {
                openInExternalBrowser();
              }}
            >
              Chrome mein kholein →
            </button>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{plan.name}{months > 1 ? ` (${months} Months)` : ''}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{displayDurationDays} days</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">STB Number:</span>
            <span className="font-medium break-all">{stbNumber}</span>
          </div>
          {dueAmount > 0 && (
            <>
              <div className="flex justify-between text-sm sm:text-base pt-3 sm:pt-4 border-t">
                <span className="text-gray-600">Plan Amount:</span>
                <span className="font-medium">{formatCurrency(displayPrice)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Outstanding Due:</span>
                <span className="font-medium text-accent-red">{formatCurrency(dueAmount * 100)}</span>
              </div>
            </>
          )}
          <div className={`flex justify-between text-base sm:text-lg font-bold pt-3 sm:pt-4 ${dueAmount > 0 ? '' : 'border-t'}`}>
            <span>Total Amount:</span>
            <span className="text-accent-red">{formatCurrency(displayPrice + dueAmount * 100)}</span>
          </div>
          {dueAmount > 0 && (
            <p className="text-xs text-gray-500 -mt-2">Due amount is included in this payment — dono ek hi transaction mein clear ho jayenge.</p>
          )}
        </div>

        <button
          onClick={inAppBrowser ? openInExternalBrowser : handlePayment}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {inAppBrowser ? 'Open in Chrome to Pay' : loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
}

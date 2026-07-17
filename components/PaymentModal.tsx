'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { load } from '@cashfreepayments/cashfree-js';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number;
  } | null;
  stbNumber: string;
  customerName?: string;
  customerMobile?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  plan,
  stbNumber,
  customerName = '',
  customerMobile = '',
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  if (!isOpen || !plan) return null;

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create order
      const orderResponse = await fetch('/api/recharge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (!orderResponse.ok) {
        const errData = await orderResponse.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Initialize Cashfree SDK
      const cashfree = await load({
        mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
      });

      // Create checkout options
      const checkoutOptions = {
        paymentSessionId: orderData.paymentSessionId,
        returnUrl: `${window.location.origin}/dashboard?order_id=${orderData.orderId}`,
      };

      // Open Cashfree checkout
      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result.error) {
          console.error('Payment error:', result.error);
          alert('Payment failed. Please try again.');
          setLoading(false);
          return;
        }

        if (result.redirect) {
          console.log('Payment will be redirected');
        }

        if (result.paymentDetails) {
          // Verify payment
          try {
            const verifyResponse = await fetch('/api/recharge/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: orderData.orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setOrderDetails({
                orderId: orderData.orderId,
                planName: plan.name,
                amount: plan.price,
              });
              setShowSuccess(true);
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (showSuccess && orderDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-2">
              Payment Successful!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Your recharge will be activated shortly by our operator
            </p>

            <div className="bg-gray-1 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
              <div className="flex justify-between mb-2 text-sm sm:text-base">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium text-xs sm:text-sm break-all ml-2">{orderDetails.orderId}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm sm:text-base">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{orderDetails.planName}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-success">
                  {formatCurrency(orderDetails.amount)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                onClose();
                window.location.href = '/dashboard';
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

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{plan.duration_days} days</span>
          </div>
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-600">STB Number:</span>
            <span className="font-medium break-all">{stbNumber}</span>
          </div>
          <div className="flex justify-between text-base sm:text-lg font-bold pt-3 sm:pt-4 border-t">
            <span>Total Amount:</span>
            <span className="text-accent-red">{formatCurrency(plan.price)}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {loading ? 'Processing...' : 'Pay with Cashfree'}
        </button>
      </div>
    </div>
  );
}

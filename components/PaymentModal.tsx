'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

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

declare global {
  interface Window {
    Razorpay: any;
  }
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
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'CableEasy',
          description: `${plan.name} - ${plan.duration_days} days`,
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/recharge/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  rechargeId: orderData.orderId,
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
          },
          prefill: {
            name: customerName,
            email: '',
            contact: customerMobile,
          },
          theme: {
            color: '#e63946',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };

  if (showSuccess && orderDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-success"
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
            <h2 className="font-display text-2xl font-bold text-brand-navy mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your recharge will be activated shortly by our operator
            </p>

            <div className="bg-gray-1 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{orderDetails.orderId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{orderDetails.planName}</span>
              </div>
              <div className="flex justify-between">
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
              className="btn-primary w-full"
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
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl font-bold text-brand-navy">
            Confirm Payment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
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

        <div className="space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">{plan.duration_days} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">STB Number:</span>
            <span className="font-medium">{stbNumber}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-4 border-t">
            <span>Total Amount:</span>
            <span className="text-accent-red">{formatCurrency(plan.price)}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay with Razorpay'}
        </button>
      </div>
    </div>
  );
}

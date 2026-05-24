'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime, getDaysRemaining } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  stb_number: string;
  area: string;
}

interface Recharge {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  cashfree_order_id: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMessage, setPaymentMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchData();
    checkPaymentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPaymentStatus = async () => {
    // Check if redirected from payment
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    
    if (orderId) {
      try {
        // Verify payment status
        const verifyResponse = await fetch('/api/recharge/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          // Show success message
          setPaymentMessage({
            type: 'success',
            text: 'Payment successful! Your recharge will be activated shortly by our operator.'
          });
        } else {
          // Show error message
          setPaymentMessage({
            type: 'error',
            text: 'Payment verification failed. Please contact support if amount was deducted.'
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setPaymentMessage({
          type: 'error',
          text: 'Unable to verify payment. Please contact support if amount was deducted.'
        });
      } finally {
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard');
        // Refresh data to show updated status
        setTimeout(() => fetchData(), 1000);
      }
    }
  };

  const fetchData = async () => {
    try {
      const [customerRes, rechargesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/recharge/history'),
      ]);

      if (!customerRes.ok) {
        router.push('/login');
        return;
      }

      const customerData = await customerRes.json();
      const rechargesData = await rechargesRes.json();

      setCustomer(customerData.customer);
      setRecharges(rechargesData.recharges || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setRecharges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const activePlan = recharges.find(
    (r) => r.status === 'activated' && r.expires_at && new Date(r.expires_at) > new Date()
  );

  const pendingActivation = recharges.find(r => r.status === 'paid');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-1">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-display text-xl sm:text-2xl font-bold text-brand-navy">
              CCN Cable
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/dashboard/buy"
                className="text-gray-600 hover:text-brand-navy font-medium text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Buy & History</span>
                <span className="sm:hidden">Buy</span>
              </Link>
              <span className="text-gray-600 text-sm sm:text-base hidden xs:inline">
                Hi, {customer?.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-accent-red hover:underline font-medium text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Payment Status Message */}
        {paymentMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            paymentMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {paymentMessage.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{paymentMessage.text}</p>
              </div>
              <button
                onClick={() => setPaymentMessage(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-2">
                {customer?.name}
              </h2>
              <div className="space-y-1 text-sm sm:text-base text-gray-600">
                <p>Mobile: {customer?.mobile}</p>
                <p>STB Number: {customer?.stb_number}</p>
                <p>Area: {customer?.area}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Activation Notice */}
        {pendingActivation && (
          <div className="card bg-yellow-50 border-l-4 border-yellow-500 mb-6 sm:mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-1">Payment Confirmed - Activation Pending</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  Your payment for <strong>{pendingActivation.plan_name}</strong> ({formatCurrency(pendingActivation.amount)}) has been received successfully.
                </p>
                <p className="text-sm text-yellow-800">
                  Our operator will activate your plan shortly. You will receive confirmation once activated.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active Plan */}
        <div className="card bg-brand-navy text-white mb-6 sm:mb-8">
          {activePlan ? (
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold mb-4">Active Plan</h3>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-xl sm:text-2xl font-bold mb-2">{activePlan.plan_name}</p>
                  <p className="text-sm sm:text-base text-gray-300">
                    Expires: {formatDateTime(new Date(activePlan.expires_at!))}
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-4xl sm:text-5xl font-bold text-accent-red mb-1">
                    {getDaysRemaining(new Date(activePlan.expires_at!))}
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">days left</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-3 sm:mb-4">No Active Plan</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 px-4">
                Recharge now to continue enjoying your favorite channels
              </p>
              <Link
                href="/plans"
                className="inline-block bg-accent-red text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Recharge Now
              </Link>
            </div>
          )}
        </div>

        {activePlan && (
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/plans"
              className="btn-primary flex-1 text-center"
            >
              Recharge Now
            </Link>
            <Link
              href="/dashboard/buy"
              className="bg-accent-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex-1 text-center"
            >
              View Buy & History
            </Link>
          </div>
        )}

        {!activePlan && (
          <div className="mb-6 sm:mb-8 text-center">
            <Link
              href="/dashboard/buy"
              className="btn-primary inline-block w-full sm:w-auto"
            >
              Browse Plans & History
            </Link>
          </div>
        )}

        {/* Recharge History */}
        <div className="card">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-4 sm:mb-6">
            Recharge History
          </h3>

          {recharges.length === 0 ? (
            <p className="text-gray-600 text-center py-8 text-sm sm:text-base">No recharge history yet</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Plan</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm hidden md:table-cell">Order ID</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Date</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Amount</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recharges.map((recharge) => (
                      <tr key={recharge.id} className="border-b last:border-b-0">
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{recharge.plan_name}</td>
                        <td className="py-3 px-2 sm:px-4 text-xs text-gray-600 hidden md:table-cell">
                          {recharge.id}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">
                          {formatDateTime(new Date(recharge.created_at))}
                        </td>
                        <td className="py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                          {formatCurrency(recharge.amount)}
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <StatusBadge status={recharge.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

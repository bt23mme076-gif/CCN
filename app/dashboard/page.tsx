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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <Link href="/" className="font-display text-2xl font-bold text-brand-navy">
              CableEasy
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Hi, {customer?.name}</span>
              <button
                onClick={handleLogout}
                className="text-accent-red hover:underline font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
          <div className="mb-6 sm:mb-8 text-center">
            <Link
              href="/plans"
              className="btn-primary inline-block w-full sm:w-auto"
            >
              Recharge Now
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

'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface RechargeItem {
  recharge: {
    id: string;
    plan_name: string;
    amount: number;
    status: string;
    created_at: string;
  };
  customer: {
    name: string;
    mobile: string;
  };
}

export default function AllRechargesPage() {
  const [recharges, setRecharges] = useState<RechargeItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    fetchRecharges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchRecharges = async () => {
    try {
      const url = search
        ? `/api/admin/recharges?search=${encodeURIComponent(search)}`
        : '/api/admin/recharges';
      const response = await fetch(url);
      const data = await response.json();
      setRecharges(data.recharges || []);
    } catch (error) {
      console.error('Failed to fetch recharges:', error);
      setRecharges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (rechargeId: string) => {
    setActivating(rechargeId);
    try {
      const response = await fetch(`/api/admin/recharges/${rechargeId}/activate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchRecharges();
      } else {
        alert('Failed to activate recharge');
      }
    } catch (error) {
      console.error('Activation error:', error);
      alert('Failed to activate recharge');
    } finally {
      setActivating(null);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-6 sm:mb-8">
        All Recharges
      </h1>

      <div className="card">
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or mobile..."
            className="input-field"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
          </div>
        ) : recharges.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No recharges found</p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recharges.map(({ recharge, customer }) => (
                    <tr key={recharge.id} className="border-b last:border-b-0">
                      <td className="py-3 px-4">{customer.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{customer.mobile}</td>
                      <td className="py-3 px-4">{recharge.plan_name}</td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(recharge.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDateTime(new Date(recharge.created_at))}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={recharge.status} />
                      </td>
                      <td className="py-3 px-4">
                        {recharge.status === 'paid' && (
                          <button
                            onClick={() => handleActivate(recharge.id)}
                            disabled={activating === recharge.id}
                            className="bg-success text-white px-4 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {activating === recharge.id ? 'Activating...' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {recharges.map(({ recharge, customer }) => (
                <div key={recharge.id} className="bg-gray-1 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-brand-navy text-base truncate">{customer.name}</h3>
                      <p className="text-sm text-gray-600">{customer.mobile}</p>
                    </div>
                    <StatusBadge status={recharge.status} />
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <p className="text-gray-600">
                      <span className="font-medium">Plan:</span> {recharge.plan_name}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Amount:</span> {formatCurrency(recharge.amount)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {formatDateTime(new Date(recharge.created_at))}
                    </p>
                  </div>
                  {recharge.status === 'paid' && (
                    <button
                      onClick={() => handleActivate(recharge.id)}
                      disabled={activating === recharge.id}
                      className="w-full bg-success text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {activating === recharge.id ? 'Activating...' : 'Activate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

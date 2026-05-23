'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDateTime, getInitials } from '@/lib/utils';

interface Stats {
  pendingCount: number;
  todayRevenue: number;
  totalRevenue: number;
  totalCustomers: number;
}

interface PendingRecharge {
  recharge: {
    id: string;
    plan_name: string;
    amount: number;
    paid_at: string;
  };
  customer: {
    name: string;
    mobile: string;
    stb_number: string;
    area: string;
  };
}

export default function PendingActivationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recharges, setRecharges] = useState<PendingRecharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, rechargesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/recharges?status=paid'),
      ]);

      const statsData = await statsRes.json();
      const rechargesData = await rechargesRes.json();

      setStats(statsData);
      setRecharges(rechargesData.recharges || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        // Remove from list
        setRecharges(recharges.filter((r) => r.recharge.id !== rechargeId));
        // Refresh stats
        const statsRes = await fetch('/api/admin/stats');
        const statsData = await statsRes.json();
        setStats(statsData);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <h1 className="font-display text-3xl font-bold text-brand-navy">
          Pending Activations
        </h1>
        {stats && stats.pendingCount > 0 && (
          <span className="bg-accent-red text-white px-3 py-1 rounded-full text-sm font-medium">
            {stats.pendingCount}
          </span>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-red-50 border-l-4 border-accent-red">
            <p className="text-gray-600 text-sm mb-1">Pending</p>
            <p className="text-3xl font-bold text-accent-red">{stats.pendingCount}</p>
          </div>
          <div className="card bg-blue-50 border-l-4 border-accent-blue">
            <p className="text-gray-600 text-sm mb-1">Today's Revenue</p>
            <p className="text-3xl font-bold text-accent-blue">
              {formatCurrency(stats.todayRevenue)}
            </p>
          </div>
          <div className="card bg-green-50 border-l-4 border-success">
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
          <div className="card bg-gray-100 border-l-4 border-brand-navy">
            <p className="text-gray-600 text-sm mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-brand-navy">{stats.totalCustomers}</p>
          </div>
        </div>
      )}

      {/* Pending Recharges List */}
      <div className="card">
        {recharges.length === 0 ? (
          <div className="text-center py-12">
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
            <h3 className="font-display text-xl font-bold text-brand-navy mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600">No pending activations at the moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recharges.map(({ recharge, customer }) => (
              <div
                key={recharge.id}
                className="flex items-center justify-between p-4 bg-gray-1 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-blue text-white rounded-full flex items-center justify-center font-bold">
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy">{customer.name}</h4>
                    <p className="text-sm text-gray-600">
                      {customer.mobile} • STB: {customer.stb_number}
                    </p>
                    <p className="text-sm text-gray-600">{customer.area}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-navy">{recharge.plan_name}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(recharge.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Paid: {formatDateTime(new Date(recharge.paid_at))}
                  </p>
                </div>
                <button
                  onClick={() => handleActivate(recharge.id)}
                  disabled={activating === recharge.id}
                  className="bg-success text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {activating === recharge.id ? 'Activating...' : 'Mark Activated'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

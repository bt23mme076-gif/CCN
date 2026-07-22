'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDateTime, getInitials } from '@/lib/utils';

interface Stats { pendingCount: number; todayRevenue: number; totalRevenue: number; totalCustomers: number; }
interface PendingRecharge {
  recharge: { id: string; plan_name: string; amount: number; paid_at: string; cashfree_order_id: string | null; };
  customer: { name: string; mobile: string; stb_number: string; area: string; };
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(10px)',
};

export default function PendingActivationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recharges, setRecharges] = useState<PendingRecharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, rechargesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/recharges?status=paid,pending'),
      ]);
      setStats(await statsRes.json());
      const d = await rechargesRes.json();
      setRecharges(d.recharges || []);
    } catch { setRecharges([]); }
    finally { setLoading(false); }
  };

  const handleDelete = async (rechargeId: string) => {
    if (!confirm('Cancel this Fast Recharge order?')) return;
    setDeleting(rechargeId);
    try {
      const res = await fetch(`/api/admin/recharges/${rechargeId}`, { method: 'DELETE' });
      if (res.ok) {
        setRecharges(recharges.filter((r) => r.recharge.id !== rechargeId));
        const statsRes = await fetch('/api/admin/stats');
        setStats(await statsRes.json());
      } else alert('Failed to delete');
    } catch { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleActivate = async (rechargeId: string) => {
    setActivating(rechargeId);
    try {
      const response = await fetch(`/api/admin/recharges/${rechargeId}/activate`, { method: 'POST' });
      if (response.ok) {
        setRecharges(recharges.filter((r) => r.recharge.id !== rechargeId));
        const statsRes = await fetch('/api/admin/stats');
        setStats(await statsRes.json());
      } else alert('Failed to activate recharge');
    } catch { alert('Failed to activate recharge'); }
    finally { setActivating(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
    </div>
  );

  const statCards = [
    { label: 'Pending', value: stats?.pendingCount ?? 0, color: '#e63946', bg: 'rgba(230,57,70,0.12)', border: 'rgba(230,57,70,0.3)', icon: '⏳' },
    { label: "Today's Revenue", value: formatCurrency(stats?.todayRevenue ?? 0), color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', icon: '📈' },
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', icon: '💰' },
    { label: 'Customers', value: stats?.totalCustomers ?? 0, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: '👥' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Pending Activations</h1>
        {stats && stats.pendingCount > 0 && (
          <span className="px-3 py-1 rounded-full text-sm font-bold w-fit animate-pulse"
            style={{ background: 'rgba(230,57,70,0.2)', color: '#e63946', border: '1px solid rgba(230,57,70,0.4)' }}>
            {stats.pendingCount} pending
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl p-4 sm:p-5"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">{s.label}</p>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {recharges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400 text-sm">No pending activations at the moment</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {recharges.map(({ recharge, customer }) => (
              <div key={recharge.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{customer.name}</h4>
                    <p className="text-xs text-gray-400 truncate">{customer.mobile} • STB: {customer.stb_number}</p>
                    <p className="text-xs text-gray-500 truncate">{customer.area}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-white text-sm">{recharge.plan_name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(recharge.amount)}</p>
                    <p className="text-xs text-gray-500">Paid: {formatDateTime(new Date(recharge.paid_at))}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(recharge.id)}
                      disabled={deleting === recharge.id}
                      className="px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #b70909, #e63946)' }}>
                      {deleting === recharge.id ? 'Deleting...' : '✕ Cancel'}
                    </button>
                    <button
                      onClick={() => handleActivate(recharge.id)}
                      disabled={activating === recharge.id}
                      className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)', boxShadow: '0 4px 15px rgba(52,183,136,0.3)' }}>
                      {activating === recharge.id ? 'Activating...' : '✓ Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

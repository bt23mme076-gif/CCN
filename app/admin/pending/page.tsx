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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkActivating, setBulkActivating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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
      setSelected(new Set());
    } catch { setRecharges([]); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === recharges.length) setSelected(new Set());
    else setSelected(new Set(recharges.map(r => r.recharge.id)));
  };

  const handleDelete = async (rechargeId: string) => {
    if (!confirm('Cancel this order?')) return;
    setDeleting(rechargeId);
    try {
      const res = await fetch(`/api/admin/recharges/${rechargeId}`, { method: 'DELETE' });
      if (res.ok) {
        setRecharges(prev => prev.filter(r => r.recharge.id !== rechargeId));
        setSelected(prev => { const n = new Set(prev); n.delete(rechargeId); return n; });
        const statsRes = await fetch('/api/admin/stats');
        setStats(await statsRes.json());
      } else alert('Failed to delete');
    } catch { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleActivate = async (rechargeId: string) => {
    setActivating(rechargeId);
    try {
      const res = await fetch(`/api/admin/recharges/${rechargeId}/activate`, { method: 'POST' });
      if (res.ok) {
        setRecharges(prev => prev.filter(r => r.recharge.id !== rechargeId));
        setSelected(prev => { const n = new Set(prev); n.delete(rechargeId); return n; });
        const statsRes = await fetch('/api/admin/stats');
        setStats(await statsRes.json());
      } else alert('Failed to activate');
    } catch { alert('Failed to activate'); }
    finally { setActivating(null); }
  };

  const handleBulkActivate = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Activate ${selected.size} recharge(s)?`)) return;
    setBulkActivating(true);
    const ids = Array.from(selected);
    let failed = 0;
    await Promise.all(ids.map(async (id) => {
      try {
        const res = await fetch(`/api/admin/recharges/${id}/activate`, { method: 'POST' });
        if (!res.ok) failed++;
      } catch { failed++; }
    }));
    if (failed > 0) alert(`${failed} activation(s) failed`);
    setBulkActivating(false);
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Cancel ${selected.size} order(s)?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    let failed = 0;
    await Promise.all(ids.map(async (id) => {
      try {
        const res = await fetch(`/api/admin/recharges/${id}`, { method: 'DELETE' });
        if (!res.ok) failed++;
      } catch { failed++; }
    }));
    if (failed > 0) alert(`${failed} deletion(s) failed`);
    setBulkDeleting(false);
    fetchData();
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

  const allSelected = recharges.length > 0 && selected.size === recharges.length;

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

      {/* Bulk action bar */}
      {recharges.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={allSelected} onChange={toggleAll}
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
            <span className="text-sm text-gray-300">
              {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
            </span>
          </label>
          {selected.size > 0 && (
            <>
              <button onClick={handleBulkActivate} disabled={bulkActivating || bulkDeleting}
                className="px-4 py-2 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
                {bulkActivating ? 'Activating...' : `✓ Activate (${selected.size})`}
              </button>
              <button onClick={handleBulkDelete} disabled={bulkActivating || bulkDeleting}
                className="px-4 py-2 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #b70909, #e63946)' }}>
                {bulkDeleting ? 'Cancelling...' : `✕ Cancel (${selected.size})`}
              </button>
            </>
          )}
        </div>
      )}

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
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 transition-colors"
                style={{ background: selected.has(recharge.id) ? 'rgba(99,102,241,0.08)' : undefined }}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <input type="checkbox" checked={selected.has(recharge.id)}
                    onChange={() => toggleSelect(recharge.id)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer flex-shrink-0" />
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
                    <button onClick={() => handleDelete(recharge.id)} disabled={deleting === recharge.id || bulkActivating || bulkDeleting}
                      className="px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #b70909, #e63946)' }}>
                      {deleting === recharge.id ? '...' : '✕'}
                    </button>
                    <button onClick={() => handleActivate(recharge.id)} disabled={activating === recharge.id || bulkActivating || bulkDeleting}
                      className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)', boxShadow: '0 4px 15px rgba(52,183,136,0.3)' }}>
                      {activating === recharge.id ? '...' : '✓ Activate'}
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

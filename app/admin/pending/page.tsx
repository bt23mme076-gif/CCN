'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDateTime, getInitials } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';

interface Stats { pendingCount: number; todayRevenue: number; monthRevenue: number; totalRevenue: number; totalCustomers: number; }
interface PendingRecharge {
  recharge: { id: string; plan_name: string; amount: number; status: string; paid_at: string | null; created_at: string; upi_reference: string | null; due_amount_paise: number | null; };
  customer: { name: string; mobile: string; stb_number: string; area: string; };
}

type DetailKey = 'today' | 'month' | 'customers';

interface DetailRecharge {
  recharge: { id: string; plan_name: string; amount: number; status: string; paid_at: string | null };
  customer: { name: string; mobile: string; area: string } | null;
}

interface DetailCustomer {
  id: string; name: string; mobile: string; area: string; created_at: string;
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(10px)',
};

export default function PendingActivationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recharges, setRecharges] = useState<PendingRecharge[]>([]);
  const [recent, setRecent] = useState<PendingRecharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkActivating, setBulkActivating] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [expandedCard, setExpandedCard] = useState<DetailKey | null>(null);
  const [detailItems, setDetailItems] = useState<(DetailRecharge | DetailCustomer)[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const pendingListRef = useRef<HTMLDivElement>(null);

  const [voiceAlertsOn, setVoiceAlertsOn] = useState(false);
  // id -> last-seen status. null until the first poll, so we never announce
  // the initial load. Keyed by status (not just id) because a recharge row
  // is created as 'pending' the moment the customer opens the payment
  // screen — long before they actually pay — so a plain "new id" check would
  // mark it seen right away and miss the pending→paid transition that
  // actually matters.
  const seenStatusRef = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    setVoiceAlertsOn(localStorage.getItem('ccn_voice_alerts') === 'on');
  }, []);

  const beep = () => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* AudioContext unavailable — speech alone still fires */ }
  };

  const describeActivity = (r: PendingRecharge) => {
    const name = r.customer.name;
    const amount = formatCurrency(r.recharge.amount);
    if (r.recharge.status === 'paid') return `Payment received from ${name}, ${amount}. Please activate.`;
    if (r.recharge.status === 'pending') return `${name} has started a payment of ${amount}.`;
    return `${name}'s order, ${amount}, is now ${r.recharge.status}.`;
  };

  const announcePending = (items: PendingRecharge[]) => {
    if (!voiceAlertsOn || typeof window === 'undefined' || !window.speechSynthesis || items.length === 0) return;
    beep();
    const text = items.length === 1
      ? describeActivity(items[0])
      : `${items.length} new activity on pending orders. Please check.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  // Keeps nagging every poll tick for as long as a paid order sits
  // unactivated — stops the instant it's activated or cancelled, since
  // either removes it from the paid/pending list this reads from.
  const announceReminder = (items: PendingRecharge[]) => {
    if (!voiceAlertsOn || typeof window === 'undefined' || !window.speechSynthesis || items.length === 0) return;
    beep();
    const text = items.length === 1
      ? `Reminder: payment from ${items[0].customer.name}, ${formatCurrency(items[0].recharge.amount)}, is still waiting. Please activate or cancel.`
      : `Reminder: ${items.length} payments still waiting. Please activate or cancel.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const toggleVoiceAlerts = () => {
    const next = !voiceAlertsOn;
    setVoiceAlertsOn(next);
    localStorage.setItem('ccn_voice_alerts', next ? 'on' : 'off');
    if (next) {
      // Speech synthesis needs a user gesture to unlock on some mobile
      // browsers — this click doubles as that unlock, with an audible test.
      beep();
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance('Voice alerts on.'));
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/recharges?status=paid,pending');
        const d = await res.json();
        const fresh: PendingRecharge[] = d.recharges || [];
        if (seenStatusRef.current) {
          // Any activity — a brand-new order (customer just started paying)
          // or an existing one's status changing (e.g. pending → paid) —
          // triggers a one-time alert, except 'paid' which the repeating
          // reminder below covers instead (so it isn't announced twice on
          // the tick it first appears).
          const changed = fresh.filter((r) => {
            const prevStatus = seenStatusRef.current!.get(r.recharge.id);
            return (prevStatus === undefined || prevStatus !== r.recharge.status) && r.recharge.status !== 'paid';
          });
          if (changed.length > 0) announcePending(changed);
        }
        seenStatusRef.current = new Map(fresh.map((r) => [r.recharge.id, r.recharge.status]));
        setRecharges(fresh);

        const unresolved = fresh.filter((r) => r.recharge.status === 'paid');
        if (unresolved.length > 0) announceReminder(unresolved);
      } catch { /* keep showing last known list, retry next tick */ }
    }, 7000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceAlertsOn]);

  const handleCardClick = async (key: 'pending' | DetailKey) => {
    if (key === 'pending') {
      pendingListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (expandedCard === key) {
      setExpandedCard(null);
      return;
    }
    setExpandedCard(key);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/stats/detail?type=${key}`);
      const data = await res.json();
      setDetailItems(data.items || []);
    } catch {
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, rechargesRes, recentRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/recharges?status=paid,pending'),
        fetch('/api/admin/recharges?limit=5'),
      ]);
      setStats(await statsRes.json());
      const d = await rechargesRes.json();
      setRecharges(d.recharges || []);
      setSelected(new Set());
      const r = await recentRes.json();
      setRecent(r.recharges || []);
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
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/recharges?limit=5'),
        ]);
        setStats(await statsRes.json());
        const r = await recentRes.json();
        setRecent(r.recharges || []);
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
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/recharges?limit=5'),
        ]);
        setStats(await statsRes.json());
        const r = await recentRes.json();
        setRecent(r.recharges || []);
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

  const statCards: { key: 'pending' | DetailKey; label: string; value: string | number; color: string; bg: string; border: string; icon: string }[] = [
    { key: 'pending', label: 'Pending', value: stats?.pendingCount ?? 0, color: '#e63946', bg: 'rgba(230,57,70,0.12)', border: 'rgba(230,57,70,0.3)', icon: '⏳' },
    { key: 'today', label: "Today's Revenue", value: formatCurrency(stats?.todayRevenue ?? 0), color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.25)', icon: '📈' },
    { key: 'month', label: "This Month's Revenue", value: formatCurrency(stats?.monthRevenue ?? 0), color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)', icon: '💰' },
    { key: 'customers', label: 'Customers', value: stats?.totalCustomers ?? 0, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)', icon: '👥' },
  ];

  const detailTitle = expandedCard === 'today' ? "Today's Recharges"
    : expandedCard === 'month' ? "This Month's Recharges"
    : expandedCard === 'customers' ? 'Recently Added Customers'
    : '';

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
        <button onClick={toggleVoiceAlerts}
          className="px-3 py-1.5 rounded-full text-xs font-semibold w-fit flex items-center gap-1.5 transition-colors"
          style={{
            background: voiceAlertsOn ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)',
            color: voiceAlertsOn ? '#34d399' : '#9ca3af',
            border: `1px solid ${voiceAlertsOn ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.1)'}`,
          }}>
          {voiceAlertsOn ? '🔊 Voice Alerts ON' : '🔇 Voice Alerts OFF'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {statCards.map((s) => (
          <button key={s.label} onClick={() => handleCardClick(s.key)}
            className="rounded-xl p-4 sm:p-5 text-left transition-all hover:scale-[1.02] cursor-pointer"
            style={{
              background: s.bg,
              border: `1px solid ${expandedCard === s.key ? s.color : s.border}`,
              boxShadow: expandedCard === s.key ? `0 0 0 2px ${s.color}33` : undefined,
            }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">{s.label}</p>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Expandable detail panel */}
      {expandedCard && (
        <div className="rounded-2xl overflow-hidden mb-6 sm:mb-8" style={cardStyle}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="font-display text-base font-bold text-white">{detailTitle}</h3>
            <div className="flex items-center gap-3">
              {expandedCard === 'month' && stats && (
                <span className="text-xs text-gray-400">All-time total: <span className="text-emerald-400 font-semibold">{formatCurrency(stats.totalRevenue)}</span></span>
              )}
              {expandedCard === 'customers' && (
                <Link href="/admin/customers" className="text-xs text-indigo-300 hover:text-indigo-200 underline">View all →</Link>
              )}
              <button onClick={() => setExpandedCard(null)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
            </div>
          ) : detailItems.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No records found.</p>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {expandedCard === 'customers'
                ? (detailItems as DetailCustomer[]).map((c) => (
                    <div key={c.id} className="flex items-center gap-4 px-4 sm:px-5 py-3.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {getInitials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{c.mobile} • {c.area}</p>
                      </div>
                      <p className="text-xs text-gray-500 flex-shrink-0">{formatDateTime(new Date(c.created_at))}</p>
                    </div>
                  ))
                : (detailItems as DetailRecharge[]).map(({ recharge, customer }) => (
                    <div key={recharge.id} className="flex items-center gap-4 px-4 sm:px-5 py-3.5">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #475569, #64748b)' }}>
                        {getInitials(customer?.name || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{customer?.name || 'Unknown customer'}</p>
                        <p className="text-xs text-gray-400 truncate">{recharge.plan_name} • {formatCurrency(recharge.amount)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <StatusBadge status={recharge.status} />
                        <p className="text-xs text-gray-500 mt-1">{recharge.paid_at ? formatDateTime(new Date(recharge.paid_at)) : '—'}</p>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      )}

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
      <div ref={pendingListRef} className="rounded-2xl overflow-hidden scroll-mt-6" style={cardStyle}>
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
                    <p className="text-xs text-gray-500">
                      {recharge.paid_at
                        ? `Paid: ${formatDateTime(new Date(recharge.paid_at))}`
                        : `Ordered: ${formatDateTime(new Date(recharge.created_at))} (unpaid)`}
                    </p>
                    {recharge.upi_reference && (
                      <p className="text-xs mt-1" style={{ color: '#34d399' }}>
                        UPI UTR: {recharge.upi_reference}
                      </p>
                    )}
                    {!!recharge.due_amount_paise && recharge.due_amount_paise > 0 && (
                      <p className="text-xs mt-1" style={{ color: '#fbbf24' }}>
                        Includes due: {formatCurrency(recharge.due_amount_paise)}
                      </p>
                    )}
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

      {/* Recent Activity */}
      {recent.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h2 className="font-display text-lg sm:text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {recent.map(({ recharge, customer }) => (
                <div key={recharge.id} className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #475569, #64748b)' }}>
                    {getInitials(customer?.name || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{customer?.name || 'Unknown customer'}</p>
                    <p className="text-xs text-gray-400 truncate">{recharge.plan_name} • {formatCurrency(recharge.amount)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge status={recharge.status} />
                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(new Date(recharge.created_at))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

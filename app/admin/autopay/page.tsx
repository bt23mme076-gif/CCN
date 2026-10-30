'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency, formatDateDMY } from '@/lib/utils';
import { readBannerFile } from '@/lib/bannerImage';

interface Sub {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  next_debit_date: string;
  last_debit_at: string | null;
  mandate_name: string;
  mandate_mobile: string;
  mandate_months: number;
  has_qr: boolean;
  customer_name: string;
  customer_mobile: string;
  stb_number: string;
}

type Tab = 'due' | 'setup' | 'active' | 'cancelled';

const SETUP_LABEL: Record<string, string> = {
  requested: 'Make QR in Collect',
  qr_ready: 'Waiting for customer to scan',
  registered: 'Customer scanned — verify in Collect',
};

const IST = 5.5 * 60 * 60 * 1000;
const istDay = (d: Date) => Math.floor((d.getTime() + IST) / 86400000);
const isDue = (s: Sub) => s.status === 'active' && istDay(new Date(s.next_debit_date)) <= istDay(new Date());

export default function AutoPayPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('setup');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/autopay', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubs(data.subscriptions || []);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error && e.message ? e.message : 'Failed to load AutoPay' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (subs.some(isDue)) setTab('due');
    // Only on first load, so the tab doesn't jump after each action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const act = async (id: string, body: Record<string, string>, okText: string) => {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/autopay/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: okText });
      await load();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error && e.message ? e.message : 'Failed to update' });
    } finally {
      setBusyId(null);
    }
  };

  const pickQr = (id: string) => {
    setUploadFor(id);
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !uploadFor) return;
    try {
      const qrData = await readBannerFile(file);
      await act(uploadFor, { action: 'upload_qr', qrData }, 'QR uploaded — the customer has been notified');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not use this image' });
    }
  };

  const groups: Record<Tab, Sub[]> = {
    due: subs.filter(isDue),
    setup: subs.filter((s) => ['requested', 'qr_ready', 'registered'].includes(s.status)),
    active: subs.filter((s) => s.status === 'active'),
    cancelled: subs.filter((s) => s.status === 'cancelled'),
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'due', label: 'Due now' },
    { key: 'setup', label: 'Setting up' },
    { key: 'active', label: 'Active' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const btn = 'px-3.5 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50 whitespace-nowrap';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">AutoPay</h1>
        <p className="text-sm text-gray-400 mt-1">Mandates are made in the Collect app. Check Collect, then record each month here.</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}
          style={{ background: message.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)' }}>
          {message.text}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto mb-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap"
            style={tab === t.key
              ? { background: 'rgba(230,57,70,0.2)', color: '#fff', border: '1px solid rgba(230,57,70,0.55)' }
              : { color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
            {t.label} ({groups[t.key].length})
          </button>
        ))}
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <p className="text-gray-400 text-sm text-center py-12">Loading…</p>
        ) : groups[tab].length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-12">Nothing here.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {groups[tab].map((s) => {
              const busy = busyId === s.id;
              return (
                <div key={s.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{s.customer_name}</p>
                    <p className="text-xs text-gray-400">{s.customer_mobile} · STB: {s.stb_number}</p>
                    <p className="text-xs text-gray-300 mt-1">
                      {s.plan_name} · <b>{formatCurrency(s.amount)}</b> / month · Debit date: <b>{formatDateDMY(s.next_debit_date)}</b>
                    </p>
                    {SETUP_LABEL[s.status] && <p className="text-xs font-semibold text-amber-300 mt-1">{SETUP_LABEL[s.status]}</p>}
                    {s.status === 'requested' && (
                      <div className="mt-2 px-3 py-2 rounded-lg text-xs text-gray-200 grid grid-cols-2 gap-x-4 gap-y-0.5 max-w-md"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="text-gray-400 col-span-2 font-semibold">Enter in Collect:</span>
                        <span>Name: <b>{s.mandate_name}</b></span>
                        <span>Mobile: <b>{s.mandate_mobile}</b></span>
                        <span>Amount: <b>{formatCurrency(s.amount)}</b></span>
                        <span>Frequency: <b>Monthly</b></span>
                        <span>Start: <b>{formatDateDMY(s.next_debit_date)}</b></span>
                        <span>Duration: <b>{s.mandate_months} months</b></span>
                      </div>
                    )}
                    {s.last_debit_at && <p className="text-[11px] text-gray-500 mt-0.5">Last received: {formatDateDMY(s.last_debit_at)}</p>}
                  </div>

                  {s.status !== 'cancelled' && (
                    <div className="flex flex-wrap gap-2">
                      {s.status !== 'active' && (
                        <button onClick={() => pickQr(s.id)} disabled={busy} className={btn} style={{ background: '#4f46e5' }}>
                          {s.has_qr ? 'Replace QR' : '⬆ Upload QR'}
                        </button>
                      )}
                      {(s.status === 'registered' || s.status === 'qr_ready') && (
                        <button onClick={() => act(s.id, { action: 'confirm' }, 'AutoPay is now active')} disabled={busy} className={btn} style={{ background: '#16a34a' }}>
                          ✓ Confirm active
                        </button>
                      )}
                      {isDue(s) && (
                        <>
                          <button onClick={() => { if (confirm(`Did Collect receive ${formatCurrency(s.amount)} from ${s.customer_name}? This creates the recharge.`)) act(s.id, { action: 'received' }, 'Recorded — the recharge is now in Pending'); }}
                            disabled={busy} className={btn} style={{ background: '#16a34a' }}>
                            ✓ Received
                          </button>
                          <button onClick={() => { if (confirm(`Mark this month's AutoPay as failed for ${s.customer_name}? They will be told to recharge.`)) act(s.id, { action: 'failed' }, 'Marked failed — the customer has been notified'); }}
                            disabled={busy} className={btn} style={{ background: '#b91c1c' }}>
                            ✕ Failed
                          </button>
                        </>
                      )}
                      <button onClick={() => { if (confirm(`Cancel AutoPay for ${s.customer_name}? Also stop the mandate in Collect.`)) act(s.id, { action: 'cancel' }, 'AutoPay cancelled'); }}
                        disabled={busy} className={btn} style={{ background: 'rgba(255,255,255,0.08)' }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

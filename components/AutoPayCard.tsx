'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDateDMY } from '@/lib/utils';
import { GlassCard, accentGradient } from '@/components/PortalUI';

interface AutoPay {
  id: string;
  plan_name: string;
  amount: number;
  status: 'requested' | 'qr_ready' | 'registered' | 'active' | 'cancelled';
  qr_data: string | null;
  next_debit_date: string;
}

interface PlanOption { id: string; name: string; price: number; duration_days: number }

const activeCid = () => (typeof window !== 'undefined' ? localStorage.getItem('ccn_active_cid') : null) || 'primary';

// Customer side of AutoPay. The mandate itself lives in the Collect app: the
// customer asks here, the admin uploads a personal QR, the customer scans it
// with their UPI app, and the admin confirms.
export default function AutoPayCard({ className = '' }: { className?: string }) {
  const [autopay, setAutopay] = useState<AutoPay | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [planId, setPlanId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`/api/autopay?cid=${encodeURIComponent(activeCid())}`, { cache: 'no-store' });
      const data = await res.json();
      setAutopay(data.autopay ?? null);
    } catch { /* keep last state */ }
    setLoaded(true);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // picks up the QR / confirmation without a reload
    return () => clearInterval(t);
  }, []);

  const startChoosing = async () => {
    setChoosing(true);
    setError('');
    if (plans.length > 0) return;
    try {
      const data = await (await fetch('/api/plans', { cache: 'no-store' })).json();
      const list: PlanOption[] = (data.plans || []).filter((p: PlanOption) => p.price > 100);
      setPlans(list);
      if (list.length > 0) setPlanId(list[0].id);
    } catch {
      setError('Could not load plans. Please try again.');
    }
  };

  const request = async () => {
    if (!planId) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/autopay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, connectionId: activeCid() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAutopay(data.autopay);
      setChoosing(false);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not request AutoPay. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const update = async (action: 'registered' | 'cancel') => {
    if (!autopay) return;
    if (action === 'cancel' && !confirm('Cancel AutoPay? You will need to recharge yourself each month. Also stop this AutoPay in your UPI app.')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/autopay', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: autopay.id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not update AutoPay.');
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  const errorLine = error && <p className="text-sm text-red-300 mt-3">{error}</p>;

  // Not set up yet
  if (!autopay) {
    return (
      <GlassCard className={`p-5 sm:p-6 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)' }}>🔁</div>
            <div>
              <p className="font-bold text-white">Never miss a recharge</p>
              <p className="text-sm text-gray-400">Turn on AutoPay and your plan renews every month from your UPI app.</p>
            </div>
          </div>
          {!choosing && (
            <button onClick={startChoosing} className="px-5 py-3 rounded-xl font-bold text-white whitespace-nowrap" style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(230,57,70,0.3)' }}>
              Turn on AutoPay
            </button>
          )}
        </div>

        {choosing && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Choose your plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white outline-none mb-3"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
              {plans.map((p) => (
                <option key={p.id} value={p.id} style={{ color: '#111' }}>{p.name} — {formatCurrency(p.price)} / month</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setChoosing(false)} disabled={busy} className="flex-1 py-3 rounded-xl font-semibold text-gray-300 hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.14)' }}>Cancel</button>
              <button onClick={request} disabled={busy || !planId} className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50" style={{ background: accentGradient }}>
                {busy ? 'Sending…' : 'Continue'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">We will prepare your personal AutoPay QR and notify you when it is ready.</p>
          </div>
        )}
        {errorLine}
      </GlassCard>
    );
  }

  const summary = `${autopay.plan_name} · ${formatCurrency(autopay.amount)} / month`;

  if (autopay.status === 'active') {
    return (
      <GlassCard className={`p-5 sm:p-6 ${className}`} style={{ borderColor: 'rgba(74,222,128,0.35)' }}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)' }}>🔁</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-green-300">AutoPay is ON</p>
            <p className="text-sm text-white">{summary}</p>
            <p className="text-xs text-gray-400 mt-0.5">Next debit around {formatDateDMY(autopay.next_debit_date)}</p>
          </div>
          <button onClick={() => update('cancel')} disabled={busy} className="text-xs font-semibold text-gray-400 hover:text-red-300 underline whitespace-nowrap">Cancel</button>
        </div>
        {errorLine}
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)' }}>🔁</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white">Setting up AutoPay</p>
          <p className="text-sm text-gray-300">{summary}</p>
        </div>
        <button onClick={() => update('cancel')} disabled={busy} className="text-xs font-semibold text-gray-400 hover:text-red-300 underline whitespace-nowrap">Cancel</button>
      </div>

      {autopay.status === 'requested' && (
        <p className="text-sm text-amber-200">⏳ We are preparing your personal QR. You will get a notification when it is ready.</p>
      )}

      {autopay.status === 'qr_ready' && autopay.qr_data && (
        <div>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl" style={{ boxShadow: '0 0 0 4px rgba(245,210,122,0.25)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={autopay.qr_data} alt="AutoPay QR" className="w-52 h-52 object-contain" />
            </div>
          </div>
          <a href={autopay.qr_data} download="ccn-autopay-qr.png"
            className="block text-center text-sm font-semibold text-gray-200 py-2.5 rounded-xl mb-4 hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.14)' }}>
            ⬇ Save QR to gallery
          </a>
          <div className="rounded-xl px-3.5 py-3 mb-4 text-sm leading-relaxed text-gray-300 space-y-1"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
            <p><b className="text-white">1.</b> Open PhonePe, Google Pay or any UPI app and scan this QR.</p>
            <p><b className="text-white">2.</b> Check the amount and approve with your UPI PIN.</p>
            <p><b className="text-white">3.</b> Come back and tap the button below.</p>
          </div>
          <button onClick={() => update('registered')} disabled={busy}
            className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50" style={{ background: accentGradient }}>
            {busy ? 'Saving…' : "I've registered AutoPay"}
          </button>
        </div>
      )}

      {autopay.status === 'registered' && (
        <p className="text-sm text-amber-200">⏳ Thanks! We are verifying your AutoPay and will notify you once it is on.</p>
      )}
      {errorLine}
    </GlassCard>
  );
}

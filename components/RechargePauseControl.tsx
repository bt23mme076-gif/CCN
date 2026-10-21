'use client';

import { useEffect, useState } from 'react';

interface MsoPause { id: string; name: string; paused: boolean; message: string }

// Admin switch per MSO: pause customer recharges for that MSO while its own
// portal is down (other MSOs keep working). Shown on the admin Pending page.
export default function RechargePauseControl() {
  const [msos, setMsos] = useState<MsoPause[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/recharge-pause', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setMsos(d.msos || []))
      .catch(() => setError('Could not load recharge switches'));
  }, []);

  const save = async (mso: MsoPause, paused: boolean, askFirst = true) => {
    if (paused && askFirst && !confirm(`Pause all ${mso.name} recharges? ${mso.name} customers will not be able to pay until you turn this back on.`)) return;
    setSaving(mso.id);
    setError('');
    try {
      const res = await fetch('/api/admin/recharge-pause', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mso: mso.id, paused, message: mso.message }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      setMsos((prev) => prev.map((m) => (m.id === mso.id ? { ...m, paused } : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setSaving(null);
    }
  };

  if (msos.length === 0 && !error) return null;
  const anyPaused = msos.some((m) => m.paused);

  return (
    <div className="mb-6 rounded-2xl p-4 sm:p-5"
      style={{
        background: anyPaused ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${anyPaused ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-white">Customer Recharges</h3>
          <p className="text-xs text-gray-400">Pause an MSO while its portal is down — the other MSO keeps working.</p>
        </div>
        {anyPaused && <span className="text-xs font-bold text-red-300 whitespace-nowrap">⛔ PAUSED</span>}
      </div>

      {error && <p className="text-xs text-red-300 mb-3">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {msos.map((m) => (
          <div key={m.id} className="rounded-xl p-3.5"
            style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${m.paused ? 'rgba(239,68,68,0.45)' : 'rgba(74,222,128,0.3)'}` }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-white">{m.name}</p>
                <p className="text-xs font-semibold" style={{ color: m.paused ? '#fca5a5' : '#4ade80' }}>
                  {m.paused ? '⛔ Recharges paused' : '✅ Recharges open'}
                </p>
              </div>
              <button type="button" onClick={() => save(m, !m.paused)} disabled={saving === m.id}
                aria-label={`${m.paused ? 'Resume' : 'Pause'} ${m.name} recharges`}
                className="relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50"
                style={{ background: m.paused ? '#ef4444' : '#22c55e' }}>
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${m.paused ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <input
              type="text"
              value={m.message}
              maxLength={300}
              onChange={(e) => setMsos((prev) => prev.map((x) => (x.id === m.id ? { ...x, message: e.target.value } : x)))}
              onBlur={() => m.paused && save(m, true, false)}
              placeholder={`Message for customers (optional) — e.g. ${m.name} server is down, try after 2 hours`}
              className="mt-3 w-full px-3 py-2 rounded-lg text-xs text-white outline-none placeholder:text-gray-500"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

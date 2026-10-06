'use client';

import { useState } from 'react';
import { accentGradient } from '@/components/PortalUI';

// Dark "premium" retrack request popup, shared by the customer dashboard and
// buy/history pages. Owns its own form state; the page just mounts/unmounts it.
export default function RetrackModal({ defaultStb, onClose }: { defaultStb: string; onClose: () => void }) {
  const [stb, setStb] = useState(defaultStb);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!stb.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/retrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stb_number: stb }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError('Could not send the request. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,5,20,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden text-center"
        style={{
          background: 'linear-gradient(160deg, #1d1a4a 0%, #15133a 60%, #100e2c 100%)',
          border: '1px solid rgba(245,210,122,0.22)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #f5d27a, #e63946, transparent)' }} />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${done ? 'rgba(74,222,128,0.25)' : 'rgba(230,57,70,0.25)'}, transparent 70%)` }} />

        <button onClick={onClose} disabled={loading} aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
          ✕
        </button>

        <div className="relative p-6 sm:p-7">
          {done ? (
            <>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', boxShadow: '0 0 30px rgba(74,222,128,0.25)' }}>
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-2">Request Submitted!</h3>
              <p className="text-sm text-gray-300 mb-6">
                Keep your STB and TV{' '}
                <span className="font-bold text-green-400">ON</span> for the next <span className="font-bold text-white">5 minutes</span>.
              </p>
              <button onClick={onClose}
                className="w-full py-3.5 rounded-xl font-bold text-gray-900"
                style={{ background: 'linear-gradient(135deg, #f5d27a 0%, #d4a24c 100%)', boxShadow: '0 8px 24px rgba(212,162,76,0.3)' }}>
                OK, Got It
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{ background: 'rgba(230,57,70,0.14)', border: '1px solid rgba(230,57,70,0.35)', boxShadow: '0 0 30px rgba(230,57,70,0.2)' }}>
                📺
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-1">Request Retrack</h3>
              <p className="text-sm text-gray-400 mb-6">Channels not working? Request a signal refresh for your set-top box.</p>

              <div className="text-left mb-5">
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">STB Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stb}
                  onChange={(e) => setStb(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                  placeholder="Enter your STB number"
                  className="w-full px-4 py-3.5 rounded-xl text-base font-mono font-semibold tracking-wider text-white outline-none transition-colors placeholder:text-gray-500 focus:border-[rgba(245,210,122,0.6)]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
                />
              </div>

              {error && <p className="text-xs text-red-300 mb-4 -mt-2 text-left">{error}</p>}

              <div className="flex gap-3">
                <button onClick={onClose} disabled={loading}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.14)' }}>
                  Cancel
                </button>
                <button onClick={submit} disabled={loading || !stb.trim()}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white disabled:opacity-50 transition-transform hover:-translate-y-0.5"
                  style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
                  {loading ? 'Sending…' : 'Send Request'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

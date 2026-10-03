'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };

export default function SuperAdminSettingsPage() {
  const [payuEnabled, setPayuEnabled] = useState(true);
  const [payuConfigured, setPayuConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/payu-settings');
      const data = await res.json();
      if (res.ok) {
        setPayuEnabled(data.payuEnabled);
        setPayuConfigured(data.payuConfigured);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async () => {
    const next = !payuEnabled;
    setSaving(true);
    try {
      const res = await fetch('/api/superadmin/payu-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payuEnabled: next }),
      });
      if (res.ok) setPayuEnabled(next);
      else alert('Failed to update. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 className="text-xl font-bold text-white">Payment Settings</h1>
          <p className="text-xs text-gray-400">Platform-wide payment gateway control</p>
        </div>
        <Link href="/superadmin"
          className="px-4 py-2 rounded-lg text-sm text-gray-400"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          ← Back
        </Link>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl p-5" style={card}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-white font-semibold mb-1">PayU Gateway</h2>
                <p className="text-sm text-gray-400">
                  Jab ON hai, customers PayU se directly pay karte hain (auto-verified). Jab OFF karoge,
                  <strong className="text-gray-300"> sabhi payment flows turant purane manual UPI + UTR submit</strong> wale
                  tarike par switch ho jayenge — koi redeploy ya env var change ki zaroorat nahi.
                </p>
                {!payuConfigured && (
                  <p className="text-xs text-yellow-400 mt-2">
                    ⚠ PAYU_MERCHANT_KEY / PAYU_SALT env vars set nahi hain — tab tak ye toggle chahe jo bhi ho, system automatically UPI fallback hi use karega.
                  </p>
                )}
              </div>
              <button
                onClick={toggle}
                disabled={saving}
                className="shrink-0 relative w-14 h-8 rounded-full transition-colors disabled:opacity-50"
                style={{ background: payuEnabled ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'rgba(255,255,255,0.15)' }}
              >
                <span
                  className="absolute top-1 w-6 h-6 rounded-full bg-white transition-transform"
                  style={{ transform: payuEnabled ? 'translateX(26px)' : 'translateX(4px)' }}
                />
              </button>
            </div>
            <p className="text-sm font-medium mt-4" style={{ color: payuEnabled ? '#4ade80' : '#f87171' }}>
              {payuEnabled ? '● PayU is ON — live gateway active' : '● PayU is OFF — all flows on manual UPI fallback'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

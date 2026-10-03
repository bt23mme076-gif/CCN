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
            <h2 className="text-white font-semibold mb-1">Payment Method</h2>
            <p className="text-sm text-gray-400 mb-4">
              <strong className="text-gray-300">Gateway</strong> select karoge to customers PayU se directly pay karenge (auto-verified).
              <strong className="text-gray-300"> UPI</strong> select karoge to sabhi payment flows manual UPI QR + UTR submit
              wale tarike par chalenge — koi redeploy ya env var change ki zaroorat nahi.
            </p>
            {!payuConfigured && (
              <p className="text-xs text-yellow-400 mb-4">
                ⚠ PAYU_MERCHANT_KEY / PAYU_SALT env vars set nahi hain — tab tak ye selection chahe jo bhi ho, system automatically UPI hi use karega.
              </p>
            )}

            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => payuEnabled && toggle()}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: !payuEnabled ? 'linear-gradient(135deg, #0891b2, #06b6d4)' : 'transparent',
                  color: !payuEnabled ? '#fff' : '#9ca3af',
                }}
              >
                UPI
              </button>
              <button
                onClick={() => !payuEnabled && toggle()}
                disabled={saving}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{
                  background: payuEnabled ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'transparent',
                  color: payuEnabled ? '#fff' : '#9ca3af',
                }}
              >
                Gateway
              </button>
            </div>

            <p className="text-sm font-medium mt-4" style={{ color: payuEnabled ? '#4ade80' : '#22d3ee' }}>
              {payuEnabled ? '● Gateway active — PayU se auto-verified payments' : '● UPI active — manual UPI QR + UTR submit'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

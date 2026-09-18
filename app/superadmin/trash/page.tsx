'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DeletedCustomer {
  customer: { id: string; name: string; mobile: string; stb_number: string; area: string; deleted_at: string };
  operatorName: string | null;
}

interface DeletedRecharge {
  recharge: { id: string; plan_name: string; amount: number; status: string; deleted_at: string };
  customer: { name: string; mobile: string } | null;
  operatorName: string | null;
}

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };

function formatDateTime(d: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date(d));
}

export default function SuperAdminTrashPage() {
  const [customers, setCustomers] = useState<DeletedCustomer[]>([]);
  const [recharges, setRecharges] = useState<DeletedRecharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    fetch('/api/superadmin/trash')
      .then(r => r.json())
      .then(d => { setCustomers(d.customers || []); setRecharges(d.recharges || []); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const restoreCustomer = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/superadmin/trash/customers/${id}`, { method: 'PATCH' });
    await load();
    setBusyId(null);
  };

  const purgeCustomer = async (id: string) => {
    if (!confirm('Permanently delete this customer and all their recharges? This cannot be undone.')) return;
    setBusyId(id);
    await fetch(`/api/superadmin/trash/customers/${id}`, { method: 'DELETE' });
    await load();
    setBusyId(null);
  };

  const restoreRecharge = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/superadmin/trash/recharges/${id}`, { method: 'PATCH' });
    await load();
    setBusyId(null);
  };

  const purgeRecharge = async (id: string) => {
    if (!confirm('Permanently delete this recharge? This cannot be undone.')) return;
    setBusyId(id);
    await fetch(`/api/superadmin/trash/recharges/${id}`, { method: 'DELETE' });
    await load();
    setBusyId(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0c29' }}>
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 className="text-xl font-bold text-white">Trash</h1>
          <p className="text-xs text-gray-400">Deleted by operator admins — restore or permanently delete</p>
        </div>
        <Link href="/superadmin" className="px-4 py-2 rounded-lg text-sm text-gray-400"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          ← Back
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Deleted customers */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Deleted Customers ({customers.length})</h2>
          <div className="rounded-xl overflow-hidden" style={card}>
            {customers.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 text-sm">Nothing here</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Customer', 'Operator', 'Deleted At', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map(({ customer: c, operatorName }) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.mobile} · STB {c.stb_number} · {c.area}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{operatorName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(c.deleted_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button disabled={busyId === c.id} onClick={() => restoreCustomer(c.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
                            Restore
                          </button>
                          <button disabled={busyId === c.id} onClick={() => purgeCustomer(c.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #b70909, #e63946)' }}>
                            Delete Forever
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Deleted recharges */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Deleted Recharges ({recharges.length})</h2>
          <div className="rounded-xl overflow-hidden" style={card}>
            {recharges.length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-500 text-sm">Nothing here</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Customer', 'Plan', 'Amount', 'Operator', 'Deleted At', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recharges.map(({ recharge: r, customer: c, operatorName }) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{c?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{c?.mobile}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{r.plan_name}</td>
                      <td className="px-4 py-3 text-gray-300">₹{(r.amount / 100).toFixed(0)}</td>
                      <td className="px-4 py-3 text-gray-300">{operatorName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(r.deleted_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button disabled={busyId === r.id} onClick={() => restoreRecharge(r.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
                            Restore
                          </button>
                          <button disabled={busyId === r.id} onClick={() => purgeRecharge(r.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #b70909, #e63946)' }}>
                            Delete Forever
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

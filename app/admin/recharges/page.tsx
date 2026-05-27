'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface RechargeItem {
  recharge: { id: string; plan_name: string; amount: number; status: string; created_at: string; };
  customer: { name: string; mobile: string; };
}

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };

export default function AllRechargesPage() {
  const [recharges, setRecharges] = useState<RechargeItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => { fetchRecharges(); }, [search]); // eslint-disable-line

  const fetchRecharges = async () => {
    try {
      const url = search ? `/api/admin/recharges?search=${encodeURIComponent(search)}` : '/api/admin/recharges';
      const data = await (await fetch(url)).json();
      setRecharges(data.recharges || []);
    } catch { setRecharges([]); }
    finally { setLoading(false); }
  };

  const handleActivate = async (rechargeId: string) => {
    setActivating(rechargeId);
    try {
      const response = await fetch(`/api/admin/recharges/${rechargeId}/activate`, { method: 'POST' });
      if (response.ok) fetchRecharges();
      else alert('Failed to activate recharge');
    } catch { alert('Failed to activate recharge'); }
    finally { setActivating(null); }
  };

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">All Recharges</h1>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or mobile..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
          </div>
        ) : recharges.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No recharges found</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full admin-table">
                <thead>
                  <tr>
                    <th>Customer</th><th>Mobile</th><th>Plan</th>
                    <th>Amount</th><th>Date</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recharges.map(({ recharge, customer }) => (
                    <tr key={recharge.id}>
                      <td className="font-medium text-white">{customer.name}</td>
                      <td className="text-gray-400">{customer.mobile}</td>
                      <td>{recharge.plan_name}</td>
                      <td className="font-semibold text-green-400">{formatCurrency(recharge.amount)}</td>
                      <td className="text-gray-400">{formatDateTime(new Date(recharge.created_at))}</td>
                      <td><StatusBadge status={recharge.status} /></td>
                      <td>
                        {recharge.status === 'paid' && (
                          <button onClick={() => handleActivate(recharge.id)} disabled={activating === recharge.id}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
                            {activating === recharge.id ? 'Activating...' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {recharges.map(({ recharge, customer }) => (
                <div key={recharge.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.mobile}</p>
                    </div>
                    <StatusBadge status={recharge.status} />
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Plan: <span className="text-gray-200">{recharge.plan_name}</span></p>
                    <p>Amount: <span className="text-green-400 font-semibold">{formatCurrency(recharge.amount)}</span></p>
                    <p>Date: {formatDateTime(new Date(recharge.created_at))}</p>
                  </div>
                  {recharge.status === 'paid' && (
                    <button onClick={() => handleActivate(recharge.id)} disabled={activating === recharge.id}
                      className="w-full py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
                      {activating === recharge.id ? 'Activating...' : '✓ Activate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

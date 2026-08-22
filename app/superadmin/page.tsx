'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Operator {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  kyc_status: string;
  commission_percent: number;
  customer_count: number;
  created_at: string;
}

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', business_name: '', subdomain: '', commission_percent: 10,
    admin_username: 'admin', admin_password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () =>
    fetch('/api/superadmin/operators').then(r => r.json()).then(setOperators);

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/superadmin/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Failed'); return; }
      setShowForm(false);
      setForm({ name: '', business_name: '', subdomain: '', commission_percent: 10, admin_username: 'admin', admin_password: '' });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch('/api/superadmin/logout', { method: 'POST' });
    router.push('/superadmin/login');
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const baseHost = new URL(appUrl.startsWith('http') ? appUrl : `https://${appUrl}`).host;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <h1 className="text-xl font-bold text-white">CCN Platform</h1>
          <p className="text-xs text-gray-400">Operator Management</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowForm(true); setFormError(''); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            + New Operator
          </button>
          <button onClick={logout} className="px-4 py-2 rounded-lg text-sm text-gray-400"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Operators', value: operators.length },
            { label: 'Active', value: operators.filter(o => o.status === 'active').length },
            { label: 'Total Customers', value: operators.reduce((s, o) => s + o.customer_count, 0) },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-4" style={card}>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Operators table */}
        <div className="rounded-xl overflow-hidden" style={card}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Operator', 'Subdomain', 'Commission', 'Customers', 'KYC', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No operators yet</td></tr>
              )}
              {operators.map(op => (
                <tr key={op.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{op.name}</p>
                    <p className="text-xs text-gray-500">{op.id}</p>
                  </td>
                  <td className="px-4 py-3 text-indigo-300 text-xs">{op.subdomain}.{baseHost}</td>
                  <td className="px-4 py-3 text-gray-300">{op.commission_percent}%</td>
                  <td className="px-4 py-3 text-gray-300">{op.customer_count}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: op.kyc_status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                        color: op.kyc_status === 'approved' ? '#4ade80' : '#facc15',
                      }}>
                      {op.kyc_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs"
                      style={{
                        background: op.status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: op.status === 'active' ? '#4ade80' : '#f87171',
                      }}>
                      {op.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`https://${op.subdomain}.${baseHost}/admin`} target="_blank" rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300">
                      Open panel →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create operator modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center px-4 z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={card}>
            <h2 className="text-lg font-bold text-white mb-4">New Operator</h2>

            {formError && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: 'Operator Name', key: 'name', placeholder: 'Reliance Cable Networks' },
                { label: 'Business Name', key: 'business_name', placeholder: 'Reliance Cable Pvt Ltd' },
                { label: 'Subdomain', key: 'subdomain', placeholder: 'reliance', hint: `→ reliance.${baseHost}` },
                { label: 'Admin Username', key: 'admin_username', placeholder: 'admin' },
                { label: 'Admin Password', key: 'admin_password', placeholder: 'Min 6 characters', type: 'password' },
              ].map(({ label, key, placeholder, hint, type }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    type={type ?? 'text'}
                    placeholder={placeholder}
                    value={(form as Record<string, string | number>)[key] as string}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                    required
                  />
                  {hint && <p className="text-xs text-indigo-400 mt-0.5">{hint}</p>}
                </div>
              ))}

              <div>
                <label className="block text-xs text-gray-400 mb-1">CCN Commission %</label>
                <input
                  type="number"
                  min={0} max={50}
                  value={form.commission_percent}
                  onChange={e => setForm(f => ({ ...f, commission_percent: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg text-sm text-gray-400"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Creating...' : 'Create Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

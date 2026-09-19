'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Operator {
  id: string;
  name: string;
  business_name: string;
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
  const [migrating, setMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [editForm, setEditForm] = useState({ name: '', business_name: '', commission_percent: 10, kyc_status: 'pending', status: 'active' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const openEdit = (op: Operator) => {
    setEditingOperator(op);
    setEditForm({
      name: op.name,
      business_name: op.business_name,
      commission_percent: op.commission_percent,
      kyc_status: op.kyc_status,
      status: op.status,
    });
    setEditError('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOperator) return;
    setEditError('');
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/superadmin/operators/${editingOperator.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? 'Failed'); return; }
      setEditingOperator(null);
      load();
    } finally {
      setEditSubmitting(false);
    }
  };

  const deleteOperator = async (id: string, customerCount: number) => {
    if (customerCount > 0) {
      alert(`Cannot delete — this operator still has ${customerCount} customer(s). Remove them first.`);
      return;
    }
    if (!confirm(`Permanently delete operator "${id}" and its admin login? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/superadmin/operators/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'Failed to delete'); return; }
      await load();
    } catch {
      alert('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const runMigrations = async () => {
    setMigrating(true);
    setMigrationLog(null);
    try {
      const res = await fetch('/api/superadmin/run-migrations', { method: 'POST' });
      const data = await res.json();
      setMigrationLog(data.log ?? [data.error ?? 'Unknown error']);
      await load();
    } catch {
      setMigrationLog(['Request failed']);
    } finally {
      setMigrating(false);
    }
  };

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
          <Link href="/superadmin/trash"
            className="px-4 py-2 rounded-lg text-sm text-gray-400 flex items-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            🗑 Trash
          </Link>
          <button onClick={runMigrations} disabled={migrating}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
            {migrating ? 'Running…' : '⚙ Run Migrations'}
          </button>
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
        {migrationLog && (
          <div className="rounded-xl p-4 mb-6 text-sm" style={card}>
            <p className="text-gray-300 font-semibold mb-2">Migration result:</p>
            <ul className="space-y-1">
              {migrationLog.map((line, i) => (
                <li key={i} className="text-gray-400">• {line}</li>
              ))}
            </ul>
          </div>
        )}

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
                    <div className="flex items-center gap-3">
                      <a href={`https://${op.subdomain}.${baseHost}/admin`} target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300">
                        Open panel →
                      </a>
                      <button onClick={() => openEdit(op)}
                        className="text-xs text-gray-300 hover:text-white">
                        Edit
                      </button>
                      <button onClick={() => deleteOperator(op.id, op.customer_count)}
                        disabled={deletingId === op.id}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
                        {deletingId === op.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
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

      {/* Edit operator modal */}
      {editingOperator && (
        <div className="fixed inset-0 flex items-center justify-center px-4 z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={card}>
            <h2 className="text-lg font-bold text-white mb-1">Edit Operator</h2>
            <p className="text-xs text-gray-500 mb-4">{editingOperator.id}</p>

            {editError && (
              <div className="mb-4 px-3 py-2 rounded-lg text-sm text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSave} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Operator Name</label>
                <input type="text" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Business Name</label>
                <input type="text" value={editForm.business_name}
                  onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">CCN Commission %</label>
                <input type="number" min={0} max={50} value={editForm.commission_percent}
                  onChange={e => setEditForm(f => ({ ...f, commission_percent: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">KYC Status</label>
                <select value={editForm.kyc_status}
                  onChange={e => setEditForm(f => ({ ...f, kyc_status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingOperator(null)}
                  className="flex-1 py-2 rounded-lg text-sm text-gray-400"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
                <button type="submit" disabled={editSubmitting}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: editSubmitting ? 0.7 : 1 }}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

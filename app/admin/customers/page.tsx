'use client';

import { useEffect, useState } from 'react';

interface CustomerItem {
  customer: { id: string; name: string; mobile: string; stb_number: string; area: string; };
  rechargeCount: number;
  lastRecharge: string | null;
}

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
const labelStyle = 'block text-sm font-medium text-gray-300 mb-2';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', stb_number: '', area: '', pin: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchCustomers(); }, [search]); // eslint-disable-line

  const fetchCustomers = async () => {
    try {
      const url = search ? `/api/admin/customers?search=${encodeURIComponent(search)}` : '/api/admin/customers';
      const data = await (await fetch(url)).json();
      setCustomers(data.customers || []);
    } catch { setCustomers([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(null); setSubmitting(true);
    try {
      const response = await fetch('/api/admin/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Customer created successfully!' });
        setFormData({ name: '', mobile: '', stb_number: '', area: '', pin: '' });
        setShowForm(false); fetchCustomers();
      } else setMessage({ type: 'error', text: data.error || 'Failed to create customer' });
    } catch { setMessage({ type: 'error', text: 'Failed to create customer' }); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!confirm(`Delete "${customerName}"? This will also delete all their recharges.`)) return;
    setDeleting(customerId);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, { method: 'DELETE' });
      if (response.ok) { setMessage({ type: 'success', text: 'Customer deleted' }); fetchCustomers(); }
      else { const data = await response.json(); setMessage({ type: 'error', text: data.error || 'Failed to delete' }); }
    } catch { setMessage({ type: 'error', text: 'Failed to delete customer' }); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Customers</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 w-full sm:w-auto"
          style={{ background: showForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e63946, #f77f00)', border: showForm ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
          {showForm ? 'Cancel' : '+ Add Customer'}
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
          style={message.type === 'success'
            ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
            : { background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)', color: '#f87171' }}>
          <span>{message.type === 'success' ? '✓' : '✕'}</span>
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
          <h2 className="font-display text-lg font-bold text-white mb-5">Create New Customer</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Name', 'text', 'name', 'Full name'], ['Mobile', 'tel', 'mobile', '10-digit mobile']].map(([label, type, key, ph]) => (
                <div key={key}>
                  <label className={labelStyle}>{label}</label>
                  <input type={type} value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={ph} required maxLength={key === 'mobile' ? 10 : undefined}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['STB Number', 'text', 'stb_number', 'Set-top box number'], ['Area', 'text', 'area', 'Area/locality']].map(([label, type, key, ph]) => (
                <div key={key}>
                  <label className={labelStyle}>{label}</label>
                  <input type={type} value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={ph} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              ))}
            </div>
            <div>
              <label className={labelStyle}>PIN (min 4 digits)</label>
              <input type="password" value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                placeholder="Customer login PIN" required minLength={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              <p className="text-xs text-gray-500 mt-1">Customer will use this PIN to login</p>
            </div>
            <button type="submit" disabled={submitting}
              className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, STB number, or area..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
          </div>
        ) : customers.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No customers found</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full admin-table">
                <thead><tr><th>Name</th><th>Mobile</th><th>STB Number</th><th>Area</th><th>Recharges</th><th>Last Plan</th><th>Action</th></tr></thead>
                <tbody>
                  {customers.map(({ customer, rechargeCount, lastRecharge }) => (
                    <tr key={customer.mobile}>
                      <td className="font-semibold text-white">{customer.name}</td>
                      <td className="text-gray-400">{customer.mobile}</td>
                      <td className="text-gray-400">{customer.stb_number}</td>
                      <td className="text-gray-400">{customer.area}</td>
                      <td>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                          {rechargeCount}
                        </span>
                      </td>
                      <td className="text-gray-400">{lastRecharge || '—'}</td>
                      <td>
                        <button onClick={() => handleDelete(customer.id, customer.name)} disabled={deleting === customer.id}
                          className="text-xs font-semibold transition-colors disabled:opacity-50"
                          style={{ color: '#f87171' }}
                          onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#ef4444'}
                          onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#f87171'}>
                          {deleting === customer.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {customers.map(({ customer, rechargeCount, lastRecharge }) => (
                <div key={customer.mobile} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.mobile}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                      {rechargeCount} recharges
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>STB: <span className="text-gray-200">{customer.stb_number}</span></p>
                    <p>Area: <span className="text-gray-200">{customer.area}</span></p>
                    <p>Last Plan: <span className="text-gray-200">{lastRecharge || '—'}</span></p>
                  </div>
                  <button onClick={() => handleDelete(customer.id, customer.name)} disabled={deleting === customer.id}
                    className="w-full py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(230,57,70,0.12)', color: '#f87171', border: '1px solid rgba(230,57,70,0.25)' }}>
                    {deleting === customer.id ? 'Deleting...' : 'Delete Customer'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

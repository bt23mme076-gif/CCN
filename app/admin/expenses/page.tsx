'use client';

import { useEffect, useState } from 'react';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  note: string | null;
  date: string;
}

const CATEGORIES = [
  { value: 'salary', label: 'Salary', color: '#a78bfa' },
  { value: 'rent', label: 'Rent', color: '#60a5fa' },
  { value: 'maintenance', label: 'Maintenance', color: '#34d399' },
  { value: 'fuel', label: 'Fuel', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#94a3b8' },
];

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
const labelStyle = 'block text-xs font-medium text-gray-400 mb-1.5';

function getCatMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[4];
}

function fmt(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function ExpensesPage() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({ title: '', amount: '', category: 'salary', note: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchExpenses(); }, [month]); // eslint-disable-line

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await (await fetch(`/api/admin/expenses?month=${month}`)).json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
      setByCategory(data.byCategory || {});
    } catch { setExpenses([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.date) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setForm({ title: '', amount: '', category: 'salary', note: '', date: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      setMessage({ type: 'success', text: 'Expense add ho gaya' });
      fetchExpenses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to add expense' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Is expense ko delete karo?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: 'Deleted' });
      fetchExpenses();
    } catch { setMessage({ type: 'error', text: 'Delete failed' }); }
    finally { setDeleting(null); }
  };

  const monthLabel = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Expenses</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track monthly expenses and payments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
          style={{ background: showForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e63946, #f77f00)', border: showForm ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
          {showForm ? 'Cancel' : '+ Add Expense'}
        </button>
      </div>

      {message && (
        <div className="mb-5 p-4 rounded-xl flex items-center gap-3 text-sm font-medium"
          style={message.type === 'success'
            ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
            : { background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)', color: '#f87171' }}>
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)}>✕</button>
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-6" style={cardStyle}>
          <h2 className="font-display text-base font-bold text-white mb-4">New Expense</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Raju salary, Office rent" required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
              <div>
                <label className={labelStyle}>Amount (₹)</label>
                <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 5000" required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white"
                  style={inputStyle}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-slate-900">{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
              </div>
            </div>
            <div>
              <label className={labelStyle}>Note (optional)</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Any additional detail..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <button type="submit" disabled={saving}
              className="px-6 py-3 rounded-xl font-bold text-white text-sm hover:scale-105 transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </form>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex items-center gap-3 mb-5">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm outline-none text-white"
          style={inputStyle} />
        <span className="text-gray-400 text-sm">{monthLabel}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="col-span-2 sm:col-span-1 rounded-xl p-4" style={{ background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.25)' }}>
          <p className="text-xs text-gray-400 mb-1">Total this month</p>
          <p className="text-xl font-black text-red-400">{fmt(total)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{expenses.length} entries</p>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.value} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-gray-400 mb-1">{cat.label}</p>
            <p className="text-base font-bold" style={{ color: cat.color }}>{fmt(byCategory[cat.value] || 0)}</p>
          </div>
        ))}
      </div>

      {/* Expense List */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-gray-400 text-center py-12 text-sm">No expenses for {monthLabel}</p>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {expenses.map((exp) => {
              const cat = getCatMeta(exp.category);
              return (
                <div key={exp.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{exp.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cat.color}18`, color: cat.color }}>{cat.label}</span>
                      <span className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {exp.note && <span className="text-xs text-gray-500 italic truncate max-w-xs">{exp.note}</span>}
                    </div>
                  </div>
                  <p className="font-bold text-white text-sm flex-shrink-0">{fmt(exp.amount)}</p>
                  <button onClick={() => handleDelete(exp.id)} disabled={deleting === exp.id}
                    className="text-gray-600 hover:text-red-400 transition-colors text-xs flex-shrink-0 disabled:opacity-40">
                    {deleting === exp.id ? '...' : '✕'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Plan { id: string; name: string; price: number; duration_days: number; channels: string[]; is_popular: boolean; is_active: boolean; }

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
const labelStyle = 'block text-sm font-medium text-gray-300 mb-2';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', duration_days: '', channels: '', is_popular: false });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    try { const data = await (await fetch('/api/admin/plans')).json(); setPlans(data.plans || []); }
    catch { setPlans([]); } finally { setLoading(false); }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !currentStatus }) });
      if (response.ok) fetchPlans();
    } catch { console.error('Failed to toggle plan'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
      const response = await fetch(url, {
        method: editingPlan ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, price: parseInt(formData.price) * 100, duration_days: parseInt(formData.duration_days), channels: formData.channels.split(',').map((c) => c.trim()), is_popular: formData.is_popular }),
      });
      if (response.ok) { setFormData({ name: '', price: '', duration_days: '', channels: '', is_popular: false }); setShowForm(false); setEditingPlan(null); fetchPlans(); }
      else alert(`Failed to ${editingPlan ? 'update' : 'create'} plan`);
    } catch { alert(`Failed to ${editingPlan ? 'update' : 'create'} plan`); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({ name: plan.name, price: (plan.price / 100).toString(), duration_days: plan.duration_days.toString(), channels: plan.channels.join(', '), is_popular: plan.is_popular });
    setShowForm(true);
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Delete "${planName}"?`)) return;
    setDeleting(planId);
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) { if (data.message?.includes('hidden')) alert(`Note: ${data.message}`); fetchPlans(); }
      else alert(data.error || 'Failed to delete plan');
    } catch { alert('Failed to delete plan'); }
    finally { setDeleting(null); }
  };

  const inputProps = (key: string, type = 'text', ph = '') => ({
    type, value: formData[key as keyof typeof formData] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [key]: e.target.value }),
    placeholder: ph, required: true,
    className: 'w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all',
    style: inputStyle,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => e.target.style.borderColor = 'rgba(99,102,241,0.6)',
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => e.target.style.borderColor = 'rgba(255,255,255,0.1)',
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Plans</h1>
        <button onClick={() => { setEditingPlan(null); setFormData({ name: '', price: '', duration_days: '', channels: '', is_popular: false }); setShowForm(!showForm); }}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 w-full sm:w-auto"
          style={{ background: showForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e63946, #f77f00)', border: showForm ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
          {showForm ? 'Cancel' : '+ Add Plan'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
          <h2 className="font-display text-lg font-bold text-white mb-5">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelStyle}>Plan Name</label><input {...inputProps('name', 'text', 'e.g. Silver')} /></div>
              <div><label className={labelStyle}>Price (₹)</label><input {...inputProps('price', 'number', '199')} /></div>
            </div>
            <div><label className={labelStyle}>Duration (days)</label><input {...inputProps('duration_days', 'number', '30')} /></div>
            <div>
              <label className={labelStyle}>Channels (comma separated)</label>
              <textarea value={formData.channels} onChange={(e) => setFormData({ ...formData, channels: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all resize-none"
                style={inputStyle} rows={3} placeholder="200+ SD Channels, Star Network, Sony Set" required
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.is_popular} onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })} className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-gray-300">Mark as Popular</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={submitting}
                className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 flex-1"
                style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                {submitting ? (editingPlan ? 'Updating...' : 'Creating...') : (editingPlan ? 'Update Plan' : 'Create Plan')}
              </button>
              {editingPlan && (
                <button type="button" onClick={() => { setEditingPlan(null); setFormData({ name: '', price: '', duration_days: '', channels: '', is_popular: false }); setShowForm(false); }}
                  className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full admin-table">
                <thead><tr><th>Name</th><th>Price</th><th>Duration</th><th>Channels</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{plan.name}</span>
                          {plan.is_popular && <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(230,57,70,0.2)', color: '#f87171', border: '1px solid rgba(230,57,70,0.3)' }}>Popular</span>}
                        </div>
                      </td>
                      <td className="font-bold text-green-400">{formatCurrency(plan.price)}</td>
                      <td className="text-gray-400">{plan.duration_days} days</td>
                      <td className="text-gray-400 text-xs">{plan.channels.slice(0, 2).join(', ')}{plan.channels.length > 2 && '...'}</td>
                      <td>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={plan.is_active
                            ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
                            : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {plan.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleEdit(plan)} className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
                          <span className="text-gray-600">|</span>
                          <button onClick={() => handleToggleActive(plan.id, plan.is_active)} className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">{plan.is_active ? 'Hide' : 'Show'}</button>
                          <span className="text-gray-600">|</span>
                          <button onClick={() => handleDelete(plan.id, plan.name)} disabled={deleting === plan.id} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">{deleting === plan.id ? 'Deleting...' : 'Delete'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white">{plan.name}</p>
                        {plan.is_popular && <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(230,57,70,0.2)', color: '#f87171' }}>Popular</span>}
                      </div>
                      <p className="text-xl font-bold text-green-400">{formatCurrency(plan.price)}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={plan.is_active
                        ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
                        : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {plan.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Duration: <span className="text-gray-200">{plan.duration_days} days</span></p>
                    <p>Channels: <span className="text-gray-200">{plan.channels.slice(0, 2).join(', ')}{plan.channels.length > 2 && '...'}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(plan)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>Edit</button>
                    <button onClick={() => handleToggleActive(plan.id, plan.is_active)} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all" style={{ background: 'rgba(255,255,255,0.08)', color: '#d1d5db', border: '1px solid rgba(255,255,255,0.15)' }}>{plan.is_active ? 'Hide' : 'Show'}</button>
                    <button onClick={() => handleDelete(plan.id, plan.name)} disabled={deleting === plan.id} className="flex-1 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50" style={{ background: 'rgba(230,57,70,0.12)', color: '#f87171', border: '1px solid rgba(230,57,70,0.25)' }}>{deleting === plan.id ? '...' : 'Delete'}</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

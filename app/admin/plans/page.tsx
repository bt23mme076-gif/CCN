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

  // Tabs: 'plans' or 'channels'
  const [activeTab, setActiveTab] = useState<'plans' | 'channels'>('plans');

  // Channels state
  const [channels, setChannels] = useState<any[]>([]);
  const [editingChannel, setEditingChannel] = useState<any | null>(null);
  const [channelPrice, setChannelPrice] = useState('');
  const [channelEpg, setChannelEpg] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [channelGenre, setChannelGenre] = useState('All');
  const [deletingChannel, setDeletingChannel] = useState<number | null>(null);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [channelForm, setChannelForm] = useState({ name: '', hd_sd: 'SD', genre: '', epg: '', type: 'Pay', price: '' });

  useEffect(() => {
    fetchPlans();
    fetchChannels();
  }, []);

  const fetchPlans = async () => {
    try { const data = await (await fetch('/api/admin/plans')).json(); setPlans(data.plans || []); }
    catch { setPlans([]); } finally { setLoading(false); }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    }
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

  const handleEditChannel = (channel: any) => {
    setEditingChannel(channel);
    setChannelPrice((channel.price / 100).toFixed(2));
    setChannelEpg(channel.epg.toString());
  };

  const handleUpdateChannelPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    setSubmitting(true);
    try {
      const priceInPaise = Math.round(parseFloat(channelPrice) * 100);
      const epgVal = parseInt(channelEpg);
      
      if (isNaN(epgVal)) {
        alert('Please enter a valid channel number');
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/admin/channels/${editingChannel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          price: priceInPaise,
          epg: epgVal
        }),
      });
      if (res.ok) {
        setEditingChannel(null);
        setChannelPrice('');
        setChannelEpg('');
        fetchChannels();
      } else {
        alert('Failed to update channel details');
      }
    } catch {
      alert('Failed to update channel details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChannel = async (channelId: number, channelName: string) => {
    if (!confirm(`Are you sure you want to delete the channel "${channelName}"?`)) return;
    setDeletingChannel(channelId);
    try {
      const response = await fetch(`/api/admin/channels/${channelId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchChannels();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete channel');
      }
    } catch {
      alert('Failed to delete channel');
    } finally {
      setDeletingChannel(null);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: channelForm.name,
          hd_sd: channelForm.hd_sd,
          genre: channelForm.genre,
          epg: parseInt(channelForm.epg),
          type: channelForm.type,
          price: parseFloat(channelForm.price),
        }),
      });
      if (res.ok) {
        setShowChannelForm(false);
        setChannelForm({ name: '', hd_sd: 'SD', genre: '', epg: '', type: 'Pay', price: '' });
        fetchChannels();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create channel');
      }
    } catch {
      alert('Failed to create channel');
    } finally {
      setSubmitting(false);
    }
  };

  const inputProps = (key: string, type = 'text', ph = '') => ({
    type, value: formData[key as keyof typeof formData] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData({ ...formData, [key]: e.target.value }),
    placeholder: ph, required: true,
    className: 'w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white',
    style: inputStyle,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => e.target.style.borderColor = 'rgba(99,102,241,0.6)',
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => e.target.style.borderColor = 'rgba(255,255,255,0.1)',
  });

  return (
    <div>
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Plans & Channels</h1>
        {activeTab === 'plans' ? (
          <button onClick={() => { setEditingPlan(null); setFormData({ name: '', price: '', duration_days: '', channels: '', is_popular: false }); setShowForm(!showForm); }}
            className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 w-full sm:w-auto"
            style={{ background: showForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e63946, #f77f00)', border: showForm ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
            {showForm ? 'Cancel' : '+ Add Plan'}
          </button>
        ) : (
          <button onClick={() => { setEditingChannel(null); setShowChannelForm(!showChannelForm); setChannelForm({ name: '', hd_sd: 'SD', genre: '', epg: '', type: 'Pay', price: '' }); }}
            className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 w-full sm:w-auto"
            style={{ background: showChannelForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e63946, #f77f00)', border: showChannelForm ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
            {showChannelForm ? 'Cancel' : '+ Add Channel'}
          </button>
        )}
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'plans'
              ? 'border-orange-500 text-orange-500 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          Plan Bundles
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'channels'
              ? 'border-orange-500 text-orange-500 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          A La Carte Channels
        </button>
      </div>

      {/* Tab Contents: PLANS */}
      {activeTab === 'plans' && (
        <>
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
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all resize-none text-white animate-none"
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
        </>
      )}

      {/* Tab Contents: CHANNELS */}
      {activeTab === 'channels' && (
        <>
          {showChannelForm && (
            <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
              <h2 className="font-display text-lg font-bold text-white mb-5">Create New Channel</h2>
              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelStyle}>Channel Name</label>
                    <input
                      type="text"
                      value={channelForm.name}
                      onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                      placeholder="e.g. Star Gold"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white border"
                      style={{ ...inputStyle, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>HD / SD</label>
                    <select
                      value={channelForm.hd_sd}
                      onChange={(e) => setChannelForm({ ...channelForm, hd_sd: e.target.value as 'HD' | 'SD' })}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-[#1c1c24] border border-white/10 text-white"
                    >
                      <option value="SD">SD</option>
                      <option value="HD">HD</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Genre</label>
                    <input
                      type="text"
                      value={channelForm.genre}
                      onChange={(e) => setChannelForm({ ...channelForm, genre: e.target.value })}
                      placeholder="e.g. Movies"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white border"
                      style={{ ...inputStyle, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Channel Number</label>
                    <input
                      type="number"
                      min="1"
                      value={channelForm.epg}
                      onChange={(e) => setChannelForm({ ...channelForm, epg: e.target.value })}
                      placeholder="e.g. 210"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white border"
                      style={{ ...inputStyle, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Type</label>
                    <input
                      type="text"
                      value={channelForm.type}
                      onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value })}
                      placeholder="e.g. Pay"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white border"
                      style={{ ...inputStyle, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Price (₹, Inclusive of Tax)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={channelForm.price}
                      onChange={(e) => setChannelForm({ ...channelForm, price: e.target.value })}
                      placeholder="e.g. 19.00"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white border"
                      style={{ ...inputStyle, borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={submitting}
                    className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 flex-1"
                    style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                    {submitting ? 'Creating Channel...' : 'Create Channel'}
                  </button>
                  <button type="button" onClick={() => setShowChannelForm(false)}
                    className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          {editingChannel && (
            <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
              <h2 className="font-display text-lg font-bold text-white mb-5">Edit Channel Details</h2>
              <form onSubmit={handleUpdateChannelPrice} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-400">Channel Name: <span className="text-white font-bold">{editingChannel.name} ({editingChannel.hd_sd})</span></p>
                    <p className="text-sm text-gray-400">Genre: <span className="text-white font-medium">{editingChannel.genre}</span></p>
                  </div>
                  <div>
                    <label className={labelStyle}>Price (₹, Inclusive of Tax)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={channelPrice}
                      onChange={(e) => setChannelPrice(e.target.value)}
                      placeholder="e.g. 29.50"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white border"
                      style={{
                        ...inputStyle,
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Channel Number</label>
                    <input
                      type="number"
                      min="1"
                      value={channelEpg}
                      onChange={(e) => setChannelEpg(e.target.value)}
                      placeholder="e.g. 115"
                      required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all text-white border"
                      style={{
                        ...inputStyle,
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={submitting}
                    className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 flex-1"
                    style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                    {submitting ? 'Updating Price...' : 'Update Price'}
                  </button>
                  <button type="button" onClick={() => { setEditingChannel(null); setChannelPrice(''); }}
                    className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            {/* Search and Filters */}
            <div className="p-4 bg-black/20 flex flex-col sm:flex-row gap-3 border-b border-white/5">
              <input
                type="text"
                placeholder="Search channels by name or channel number..."
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                className="px-4 py-2 rounded-xl text-sm outline-none bg-white/5 border border-white/10 text-white flex-1 focus:border-orange-500/50"
              />
              <select
                value={channelGenre}
                onChange={(e) => setChannelGenre(e.target.value)}
                className="px-4 py-2 rounded-xl text-sm outline-none bg-[#1a1a24] border border-white/10 text-white focus:border-orange-500/50"
              >
                <option value="All">All Genres</option>
                {Array.from(new Set(channels.map((c) => c.genre))).sort().map((genre: any) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full admin-table">
                  <thead>
                    <tr>
                      <th>Channel Number</th>
                      <th>Channel Name</th>
                      <th>Type</th>
                      <th>Genre</th>
                      <th>MRP (Base)</th>
                      <th>MRP + Tax (Price)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels
                      .filter((c) => {
                        const matchesSearch = c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
                                              c.epg.toString().includes(channelSearch);
                        const matchesGenre = channelGenre === 'All' || c.genre === channelGenre;
                        return matchesSearch && matchesGenre;
                      })
                      .map((c) => (
                        <tr key={c.id}>
                          <td className="text-gray-400 font-semibold">{c.epg}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">{c.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                c.hd_sd === 'HD' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'
                              }`}>
                                {c.hd_sd}
                              </span>
                            </div>
                          </td>
                          <td className="text-gray-400 text-xs uppercase font-semibold">{c.type}</td>
                          <td className="text-gray-400 text-xs">{c.genre}</td>
                          <td className="text-gray-400">₹{(c.mrp / 100).toFixed(2)}</td>
                          <td className="font-bold text-green-400">₹{(c.price / 100).toFixed(2)}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleEditChannel(c)}
                                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                              >
                                Edit Price
                              </button>
                              <span className="text-gray-600">|</span>
                              <button onClick={() => handleDeleteChannel(c.id, c.name)}
                                disabled={deletingChannel === c.id}
                                className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                              >
                                {deletingChannel === c.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

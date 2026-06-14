'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Accessory {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_active: boolean;
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(10px)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

const labelStyle = 'block text-sm font-medium text-gray-300 mb-2';

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAccessories();
  }, []);

  const fetchAccessories = async () => {
    try {
      const response = await fetch('/api/admin/accessories');
      const data = await response.json();
      setAccessories(data.accessories || []);
    } catch (error) {
      console.error('Failed to fetch accessories:', error);
      setAccessories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (accId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/accessories/${accId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (response.ok) fetchAccessories();
    } catch (error) {
      console.error('Failed to toggle accessory status:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingAccessory ? `/api/admin/accessories/${editingAccessory.id}` : '/api/admin/accessories';
      const response = await fetch(url, {
        method: editingAccessory ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: parseInt(formData.price) * 100, // convert ₹ to paise
          description: formData.description,
        }),
      });

      if (response.ok) {
        setFormData({ name: '', price: '', description: '' });
        setShowForm(false);
        setEditingAccessory(null);
        fetchAccessories();
      } else {
        alert(`Failed to ${editingAccessory ? 'update' : 'create'} accessory`);
      }
    } catch (error) {
      alert(`Failed to ${editingAccessory ? 'update' : 'create'} accessory`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Accessory) => {
    setEditingAccessory(item);
    setFormData({
      name: item.name,
      price: (item.price / 100).toString(),
      description: item.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (accId: string, name: string) => {
    if (!confirm(`Delete accessory "${name}"?`)) return;
    setDeleting(accId);
    try {
      const response = await fetch(`/api/admin/accessories/${accId}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        if (data.message?.includes('hidden')) {
          alert(`Note: ${data.message}`);
        }
        fetchAccessories();
      } else {
        alert(data.error || 'Failed to delete accessory');
      }
    } catch (error) {
      alert('Failed to delete accessory');
    } finally {
      setDeleting(null);
    }
  };

  const inputProps = (key: string, type = 'text', ph = '') => ({
    type,
    value: formData[key as keyof typeof formData] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
    placeholder: ph,
    required: true,
    className: 'w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all',
    style: inputStyle,
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = 'rgba(99,102,241,0.6)'),
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      (e.target.style.borderColor = 'rgba(255,255,255,0.1)'),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Accessories & Hardware</h1>
        <button
          onClick={() => {
            setEditingAccessory(null);
            setFormData({ name: '', price: '', description: '' });
            setShowForm(!showForm);
          }}
          className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 w-full sm:w-auto"
          style={{
            background: showForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e63946, #f77f00)',
            border: showForm ? '1px solid rgba(255,255,255,0.2)' : 'none',
          }}
        >
          {showForm ? 'Cancel' : '+ Add Accessory'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5 sm:p-6 mb-6" style={cardStyle}>
          <h2 className="font-display text-lg font-bold text-white mb-5">
            {editingAccessory ? 'Edit Accessory' : 'Create New Accessory'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Accessory Name</label>
                <input {...inputProps('name', 'text', 'e.g. Remote Control')} />
              </div>
              <div>
                <label className={labelStyle}>Price (₹)</label>
                <input {...inputProps('price', 'number', '250')} />
              </div>
            </div>
            <div>
              <label className={labelStyle}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all resize-none"
                style={inputStyle}
                rows={3}
                placeholder="Brief details of the hardware product..."
                required
                onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 flex-1"
                style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}
              >
                {submitting ? 'Submitting...' : editingAccessory ? 'Update Accessory' : 'Create Accessory'}
              </button>
              {editingAccessory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAccessory(null);
                    setFormData({ name: '', price: '', description: '' });
                    setShowForm(false);
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
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
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#e63946', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessories.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="font-semibold text-white">{item.name}</span>
                      </td>
                      <td className="font-bold text-green-400">{formatCurrency(item.price)}</td>
                      <td className="text-gray-400 text-xs max-w-xs truncate">{item.description}</td>
                      <td>
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={
                            item.is_active
                              ? {
                                  background: 'rgba(52,211,153,0.12)',
                                  color: '#34d399',
                                  border: '1px solid rgba(52,211,153,0.3)',
                                }
                              : {
                                  background: 'rgba(255,255,255,0.06)',
                                  color: '#9ca3af',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }
                          }
                        >
                          {item.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Edit
                          </button>
                          <span className="text-gray-600">|</span>
                          <button
                            onClick={() => handleToggleActive(item.id, item.is_active)}
                            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            {item.is_active ? 'Hide' : 'Show'}
                          </button>
                          <span className="text-gray-600">|</span>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={deleting === item.id}
                            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            {deleting === item.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {accessories.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-xl font-bold text-green-400">{formatCurrency(item.price)}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={
                        item.is_active
                          ? {
                              background: 'rgba(52,211,153,0.12)',
                              color: '#34d399',
                              border: '1px solid rgba(52,211,153,0.3)',
                            }
                          : {
                              background: 'rgba(255,255,255,0.06)',
                              color: '#9ca3af',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }
                      }
                    >
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p className="line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: '#d1d5db',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    >
                      {item.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={deleting === item.id}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                      style={{
                        background: 'rgba(230,57,70,0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(230,57,70,0.25)',
                      }}
                    >
                      {deleting === item.id ? '...' : 'Delete'}
                    </button>
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

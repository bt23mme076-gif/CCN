'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  channels: string[];
  is_popular: boolean;
  is_active: boolean;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    channels: '',
    is_popular: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        fetchPlans();
      }
    } catch (error) {
      console.error('Failed to toggle plan:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingPlan 
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans';
      
      const method = editingPlan ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: parseInt(formData.price) * 100, // Convert to paise
          duration_days: parseInt(formData.duration_days),
          channels: formData.channels.split(',').map((c) => c.trim()),
          is_popular: formData.is_popular,
        }),
      });

      if (response.ok) {
        setFormData({
          name: '',
          price: '',
          duration_days: '',
          channels: '',
          is_popular: false,
        });
        setShowForm(false);
        setEditingPlan(null);
        fetchPlans();
      } else {
        alert(`Failed to ${editingPlan ? 'update' : 'create'} plan`);
      }
    } catch (error) {
      console.error(`Failed to ${editingPlan ? 'update' : 'create'} plan:`, error);
      alert(`Failed to ${editingPlan ? 'update' : 'create'} plan`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: (plan.price / 100).toString(),
      duration_days: plan.duration_days.toString(),
      channels: plan.channels.join(', '),
      is_popular: plan.is_popular,
    });
    setShowForm(true);
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(planId);
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        if (data.message.includes('hidden')) {
          alert(`Note: ${data.message}`);
        }
        fetchPlans();
      } else {
        alert(data.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete plan');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: '',
      duration_days: '',
      channels: '',
      is_popular: false,
    });
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy">Plans</h1>
        <button
          onClick={() => {
            setEditingPlan(null);
            setFormData({
              name: '',
              price: '',
              duration_days: '',
              channels: '',
              is_popular: false,
            });
            setShowForm(!showForm);
          }}
          className="btn-primary w-full sm:w-auto"
        >
          {showForm ? 'Cancel' : 'Add Plan'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-8">
          <h2 className="font-display text-xl font-bold text-brand-navy mb-4">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (days)
              </label>
              <input
                type="number"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({ ...formData, duration_days: e.target.value })
                }
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channels (comma separated)
              </label>
              <textarea
                value={formData.channels}
                onChange={(e) => setFormData({ ...formData, channels: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="e.g., 200+ SD Channels, Star Network, Sony Set"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_popular"
                checked={formData.is_popular}
                onChange={(e) =>
                  setFormData({ ...formData, is_popular: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="is_popular" className="text-sm font-medium text-gray-700">
                Mark as Popular
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 flex-1"
              >
                {submitting ? (editingPlan ? 'Updating...' : 'Creating...') : (editingPlan ? 'Update Plan' : 'Create Plan')}
              </button>
              {editingPlan && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex-1"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Channels</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className="border-b last:border-b-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.name}</span>
                          {plan.is_popular && (
                            <span className="bg-accent-red text-white text-xs px-2 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(plan.price)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {plan.duration_days} days
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {plan.channels.slice(0, 2).join(', ')}
                        {plan.channels.length > 2 && '...'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            plan.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {plan.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(plan)}
                            className="text-accent-blue hover:underline text-sm font-medium"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleToggleActive(plan.id, plan.is_active)}
                            className="text-accent-blue hover:underline text-sm font-medium"
                          >
                            {plan.is_active ? 'Hide' : 'Show'}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(plan.id, plan.name)}
                            disabled={deleting === plan.id}
                            className="text-accent-red hover:underline text-sm font-medium disabled:opacity-50"
                          >
                            {deleting === plan.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-gray-1 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-brand-navy text-base">{plan.name}</h3>
                        {plan.is_popular && (
                          <span className="bg-accent-red text-white text-xs px-2 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xl font-bold text-accent-blue">{formatCurrency(plan.price)}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        plan.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <p className="text-gray-600">
                      <span className="font-medium">Duration:</span> {plan.duration_days} days
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Channels:</span> {plan.channels.slice(0, 2).join(', ')}
                      {plan.channels.length > 2 && '...'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="flex-1 bg-accent-blue text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(plan.id, plan.is_active)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      {plan.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id, plan.name)}
                      disabled={deleting === plan.id}
                      className="flex-1 bg-red-50 text-accent-red py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      {deleting === plan.id ? 'Deleting...' : 'Delete'}
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

'use client';

import { useEffect, useState } from 'react';

interface CustomerItem {
  customer: {
    id: string;
    name: string;
    mobile: string;
    stb_number: string;
    area: string;
  };
  rechargeCount: number;
  lastRecharge: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    stb_number: '',
    area: '',
    pin: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchCustomers = async () => {
    try {
      const url = search
        ? `/api/admin/customers?search=${encodeURIComponent(search)}`
        : '/api/admin/customers';
      const response = await fetch(url);
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Customer created successfully!' });
        setFormData({
          name: '',
          mobile: '',
          stb_number: '',
          area: '',
          pin: '',
        });
        setShowForm(false);
        fetchCustomers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create customer' });
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
      setMessage({ type: 'error', text: 'Failed to create customer' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete "${customerName}"? This will also delete all their recharges. This action cannot be undone.`)) {
      return;
    }

    setDeleting(customerId);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Customer deleted successfully' });
        fetchCustomers();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete customer' });
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      setMessage({ type: 'error', text: 'Failed to delete customer' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold text-brand-navy">
          Customers
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : 'Add Customer'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message.text}</p>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-8">
          <h2 className="font-display text-xl font-bold text-brand-navy mb-4">
            Create New Customer
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
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
                  Mobile (10 digits)
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="input-field"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  STB Number
                </label>
                <input
                  type="text"
                  value={formData.stb_number}
                  onChange={(e) => setFormData({ ...formData, stb_number: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN (minimum 4 characters)
              </label>
              <input
                type="password"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="input-field"
                minLength={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Customer will use this PIN to login
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, STB number, or area..."
            className="input-field"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
          </div>
        ) : customers.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No customers found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Mobile</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">STB Number</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Area</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Recharges</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Last Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(({ customer, rechargeCount, lastRecharge }) => (
                  <tr key={customer.mobile} className="border-b last:border-b-0">
                    <td className="py-3 px-4 font-medium">{customer.name}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.mobile}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.stb_number}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.area}</td>
                    <td className="py-3 px-4">
                      <span className="bg-accent-blue bg-opacity-10 text-accent-blue px-3 py-1 rounded-full text-sm font-medium">
                        {rechargeCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {lastRecharge || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(customer.id, customer.name)}
                        disabled={deleting === customer.id}
                        className="text-accent-red hover:underline text-sm font-medium disabled:opacity-50"
                      >
                        {deleting === customer.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

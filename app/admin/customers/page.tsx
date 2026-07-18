'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/utils';

interface CustomerItem {
  customer: { id: string; name: string; mobile: string; stb_number: string; area: string; outstanding_balance: number; notes: string | null; };
  rechargeCount: number;
  lastRecharge: string | null;
}

interface CustomerDetailRecharge {
  recharge: {
    id: string;
    plan_name: string;
    amount: number;
    status: string;
    created_at: string;
    paid_at: string | null;
    activated_at: string | null;
    expires_at: string | null;
    cashfree_order_id: string | null;
    cashfree_payment_id: string | null;
  };
  plan: { id: string; name: string; channels: string[]; duration_days: number } | null;
}

interface CustomerDetailResponse {
  customer: {
    id: string;
    name: string;
    mobile: string;
    stb_number: string;
    area: string;
    created_at: string;
  };
  recharges: CustomerDetailRecharge[];
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

  // States for Price Overrides
  const [selectedCustForPrice, setSelectedCustForPrice] = useState<{ id: string; name: string } | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customPriceVal, setCustomPriceVal] = useState('');
  const [noteVal, setNoteVal] = useState('');
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);

  // States for Manual Plan Activation
  const [selectedCustForPlan, setSelectedCustForPlan] = useState<{ id: string; name: string } | null>(null);
  const [selectedPlanToActivate, setSelectedPlanToActivate] = useState('');
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  // States for Password/PIN Reset
  const [selectedCustForReset, setSelectedCustForReset] = useState<{ id: string; name: string } | null>(null);
  const [newPinVal, setNewPinVal] = useState('');
  const [resettingPin, setResettingPin] = useState(false);
  const [activatingPlan, setActivatingPlan] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetailResponse | null>(null);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [customerDetailError, setCustomerDetailError] = useState('');

  // States for Edit Customer
  const [selectedCustForEdit, setSelectedCustForEdit] = useState<{ id: string; name: string; mobile: string; stb_number: string; area: string } | null>(null);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', stb_number: '', area: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // States for Notes
  const [selectedCustForNotes, setSelectedCustForNotes] = useState<{ id: string; name: string; notes: string } | null>(null);
  const [notesVal, setNotesVal] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // States for Dues
  const [selectedCustForDues, setSelectedCustForDues] = useState<{ id: string; name: string; outstanding_balance: number } | null>(null);
  const [duesAmount, setDuesAmount] = useState('');
  const [savingDues, setSavingDues] = useState(false);

  // Dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  const toggleDropdown = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openDropdown === id) { setOpenDropdown(null); setDropdownPos(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpenDropdown(id);
  };

  useEffect(() => {
    fetchCustomers();
    fetchPlans();
  }, [search]); // eslint-disable-line

  const fetchPlans = async () => {
    try {
      const data = await (await fetch('/api/admin/plans')).json();
      setPlans(data.plans || []);
    } catch {
      setPlans([]);
    }
  };

  const fetchOverrides = async (customerId: string) => {
    setLoadingOverrides(true);
    try {
      const data = await (await fetch(`/api/admin/customers/${customerId}/price-overrides`)).json();
      setOverrides(data.overrides || []);
    } catch {
      setOverrides([]);
    } finally {
      setLoadingOverrides(false);
    }
  };

  const handleManagePrices = (customer: { id: string; name: string }) => {
    setSelectedCustForPrice(customer);
    setSelectedPlanId('');
    setCustomPriceVal('');
    setNoteVal('');
    fetchOverrides(customer.id);
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForPrice || !selectedPlanId || !customPriceVal) return;
    setSavingOverride(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustForPrice.id}/price-overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlanId,
          custom_price: parseFloat(customPriceVal),
          note: noteVal,
        }),
      });
      if (res.ok) {
        setSelectedPlanId('');
        setCustomPriceVal('');
        setNoteVal('');
        fetchOverrides(selectedCustForPrice.id);
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save override');
      }
    } catch {
      alert('Failed to save override');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDeleteOverride = async (planId: string) => {
    if (!selectedCustForPrice) return;
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustForPrice.id}/price-overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });
      if (res.ok) {
        fetchOverrides(selectedCustForPrice.id);
      } else {
        alert('Failed to delete override');
      }
    } catch {
      alert('Failed to delete override');
    }
  };


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

  const handleExportCSV = async () => {
    try {
      const data = await (await fetch('/api/admin/customers')).json();
      const all: CustomerItem[] = data.customers || [];
      const rows = [
        ['Name', 'Mobile', 'STB Number', 'Area', 'Total Recharges', 'Last Recharge'],
        ...all.map(({ customer, rechargeCount, lastRecharge }) => [
          customer.name,
          customer.mobile,
          customer.stb_number,
          customer.area,
          rechargeCount,
          lastRecharge ? new Date(lastRecharge).toLocaleDateString('en-IN') : 'Never',
        ]),
      ];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CCN_Customers_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    }
  };

  const handleOpenActivatePlan = (customer: { id: string; name: string }) => {
    setSelectedCustForPlan(customer);
    setSelectedPlanToActivate('');
    setCustomExpiryDate('');
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanToActivate(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const d = new Date();
      d.setDate(d.getDate() + plan.duration_days);
      setCustomExpiryDate(d.toISOString().split('T')[0]);
    }
  };

  const handleActivatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForPlan || !selectedPlanToActivate) return;
    setActivatingPlan(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustForPlan.id}/activate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanToActivate,
          customExpiryDate: customExpiryDate,
        }),
      });
      if (res.ok) {
        setSelectedCustForPlan(null);
        setSelectedPlanToActivate('');
        setCustomExpiryDate('');
        alert('Plan activated successfully for customer!');
        fetchCustomers();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to activate plan');
      }
    } catch {
      alert('Failed to activate plan');
    } finally {
      setActivatingPlan(false);
    }
  };

  const handleDeactivateCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to deactivate all active plan subscriptions for "${customerName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/deactivate`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('All active plan subscriptions deactivated successfully!');
        fetchCustomers();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to deactivate subscriptions');
      }
    } catch {
      alert('Failed to deactivate subscriptions');
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForReset || !newPinVal) return;
    setResettingPin(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustForReset.id}/reset-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPinVal }),
      });
      if (res.ok) {
        setSelectedCustForReset(null);
        setNewPinVal('');
        alert('Customer PIN/Password reset successfully!');
        fetchCustomers();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to reset PIN');
      }
    } catch {
      alert('Failed to reset PIN');
    } finally {
      setResettingPin(false);
    }
  };

  const handleSaveDue = async () => {
    if (!selectedCustForDues) return;
    const amount = parseInt(duesAmount, 10);
    if (isNaN(amount) || amount < 0) return;
    setSavingDues(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustForDues.id}/dues`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error();
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer.id === selectedCustForDues.id
            ? { ...c, customer: { ...c.customer, outstanding_balance: amount } }
            : c
        )
      );
      setMessage({ type: 'success', text: amount === 0
        ? `${selectedCustForDues.name} ka due clear ho gaya`
        : `${selectedCustForDues.name} ka due ₹${amount} set ho gaya` });
      setSelectedCustForDues(null);
    } catch {
      setMessage({ type: 'error', text: 'Due update nahi hua, dobara try karo' });
    } finally {
      setSavingDues(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCustForEdit) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustForEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer.id === selectedCustForEdit.id
            ? { ...c, customer: { ...c.customer, ...editForm } }
            : c
        )
      );
      setMessage({ type: 'success', text: `${editForm.name} ka details update ho gaya` });
      setSelectedCustForEdit(null);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Update nahi hua, dobara try karo' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCustForNotes) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustForNotes.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesVal.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer.id === selectedCustForNotes.id
            ? { ...c, customer: { ...c.customer, notes: notesVal.trim() || null } }
            : c
        )
      );
      setMessage({ type: 'success', text: `${selectedCustForNotes.name} ka note save ho gaya` });
      setSelectedCustForNotes(null);
    } catch {
      setMessage({ type: 'error', text: 'Note save nahi hua, dobara try karo' });
    } finally {
      setSavingNotes(false);
    }
  };

  const openCustomerDetails = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerDetail(null);
    setCustomerDetailError('');
    setLoadingCustomerDetail(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      const data = await response.json();
      if (!response.ok) {
        setCustomerDetailError(data.error || 'Failed to load customer details');
        return;
      }
      setSelectedCustomerDetail(data);
    } catch {
      setCustomerDetailError('Failed to load customer details');
    } finally {
      setLoadingCustomerDetail(false);
    }
  };

  const closeCustomerDetails = () => {
    setSelectedCustomerId(null);
    setSelectedCustomerDetail(null);
    setCustomerDetailError('');
    setLoadingCustomerDetail(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Customers</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>
            ↓ Export CSV
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105"
            style={{ background: showForm ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #e63946, #f77f00)', border: showForm ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
            {showForm ? 'Cancel' : '+ Add Customer'}
          </button>
        </div>
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
                <thead><tr><th>Name</th><th>Mobile</th><th>STB</th><th>Area</th><th>Plans</th><th></th></tr></thead>
                <tbody>
                  {customers.map(({ customer, rechargeCount, lastRecharge }) => (
                    <tr key={customer.mobile}>
                      <td>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => openCustomerDetails(customer.id)}
                            className="font-semibold text-white text-left hover:text-amber-300 transition-colors underline decoration-dotted underline-offset-4">
                            {customer.name}
                          </button>
                          {customer.outstanding_balance > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                              style={{ background: 'rgba(230,57,70,0.2)', color: '#f87171', border: '1px solid rgba(230,57,70,0.4)' }}>
                              DUE ₹{customer.outstanding_balance}
                            </span>
                          )}
                          {customer.notes && (
                            <span title={customer.notes} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold cursor-help"
                              style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                              📝
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{lastRecharge || '—'}</p>
                      </td>
                      <td className="text-gray-400 text-sm">{customer.mobile}</td>
                      <td className="text-gray-400 text-sm">{customer.stb_number}</td>
                      <td className="text-gray-400 text-sm">{customer.area}</td>
                      <td>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                          {rechargeCount}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => toggleDropdown(customer.id, e)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>
                          ⋯
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {customers.map(({ customer, rechargeCount, lastRecharge }) => (
                <div key={customer.mobile} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button type="button" onClick={() => openCustomerDetails(customer.id)}
                          className="font-semibold text-white text-left hover:text-amber-300 transition-colors underline decoration-dotted underline-offset-4">
                          {customer.name}
                        </button>
                        {customer.outstanding_balance > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: 'rgba(230,57,70,0.2)', color: '#f87171', border: '1px solid rgba(230,57,70,0.4)' }}>
                            DUE ₹{customer.outstanding_balance}
                          </span>
                        )}
                        {customer.notes && (
                          <span title={customer.notes} className="px-1.5 py-0.5 rounded-full text-[10px] font-bold cursor-help"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                            📝
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{customer.mobile} · {customer.area}</p>
                      <p className="text-xs text-gray-500 mt-0.5">STB: {customer.stb_number}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                          {rechargeCount} plans
                        </span>
                        {lastRecharge && <span className="text-[10px] text-gray-500">{lastRecharge}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button onClick={(e) => toggleDropdown(customer.id, e)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}>
                        ⋯
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating action dropdown — fixed position so it escapes overflow:hidden */}
      {openDropdown && dropdownPos && (() => {
        const c = customers.find((x) => x.customer.id === openDropdown)?.customer;
        if (!c) return null;
        return (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setOpenDropdown(null); setDropdownPos(null); }} />
            <div className="fixed z-50 w-44 rounded-xl shadow-2xl overflow-hidden"
              style={{ top: dropdownPos.top, right: dropdownPos.right, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.12)' }}>
              {[
                { label: '👁 View Details', action: () => openCustomerDetails(c.id), color: '#e2e8f0' },
                { label: '✏️ Edit', action: () => { setSelectedCustForEdit(c); setEditForm({ name: c.name, mobile: c.mobile, stb_number: c.stb_number, area: c.area }); }, color: '#60a5fa' },
                { label: c.outstanding_balance > 0 ? `💰 Due ₹${c.outstanding_balance}` : '💰 Set Due', action: () => { setSelectedCustForDues({ id: c.id, name: c.name, outstanding_balance: c.outstanding_balance }); setDuesAmount(String(c.outstanding_balance)); }, color: c.outstanding_balance > 0 ? '#f87171' : '#94a3b8' },
                { label: '📝 Notes', action: () => { setSelectedCustForNotes({ id: c.id, name: c.name, notes: c.notes || '' }); setNotesVal(c.notes || ''); }, color: '#a78bfa' },
                { label: '✅ Activate Plan', action: () => handleOpenActivatePlan(c), color: '#34d399' },
                { label: '⛔ Deactivate', action: () => handleDeactivateCustomer(c.id, c.name), color: '#f59e0b' },
                { label: '💲 Set Prices', action: () => handleManagePrices(c), color: '#a78bfa' },
                { label: '🔑 Reset PIN', action: () => setSelectedCustForReset(c), color: '#ec4899' },
                { label: deleting === c.id ? 'Deleting…' : '🗑 Delete', action: () => handleDelete(c.id, c.name), color: '#f87171' },
              ].map(({ label, action, color }) => (
                <button key={label} onClick={() => { action(); setOpenDropdown(null); setDropdownPos(null); }}
                  className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 transition-colors"
                  style={{ color }}>
                  {label}
                </button>
              ))}
            </div>
          </>
        );
      })()}

      {/* Customer Details Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl p-5 sm:p-6 overflow-y-auto max-h-[90vh] shadow-2xl border text-white"
               style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Customer Details</h3>
                <p className="text-sm text-gray-400 mt-1">Full recharge history and channel information for admin</p>
              </div>
              <button onClick={closeCustomerDetails} className="text-gray-400 hover:text-white transition-colors text-xl font-bold">
                ✕
              </button>
            </div>

            {loadingCustomerDetail ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
              </div>
            ) : customerDetailError ? (
              <p className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4">{customerDetailError}</p>
            ) : selectedCustomerDetail ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Customer</p>
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer.name}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Mobile</p>
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer.mobile}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">STB</p>
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer.stb_number}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Area</p>
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer.area}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Recharge History</h4>
                    <span className="text-xs text-gray-500">{selectedCustomerDetail.recharges.length} record(s)</span>
                  </div>
                  <div className="space-y-3">
                    {selectedCustomerDetail.recharges.length === 0 ? (
                      <p className="text-gray-400 text-sm rounded-xl p-4 bg-white/5 border border-white/10">No recharge history found for this customer.</p>
                    ) : (
                      selectedCustomerDetail.recharges.map(({ recharge, plan }) => (
                        <div key={recharge.id} className="rounded-2xl p-4 bg-white/5 border border-white/10 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div>
                              <p className="font-semibold text-white">{recharge.plan_name}</p>
                              <p className="text-xs text-gray-400 mt-1">Recharge ID: {recharge.id}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-white/10 border border-white/10 self-start">
                              {recharge.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-300">
                            <p>Date: <span className="text-gray-100">{formatDateTime(new Date(recharge.created_at))}</span></p>
                            <p>Paid: <span className="text-gray-100">{recharge.paid_at ? formatDateTime(new Date(recharge.paid_at)) : '—'}</span></p>
                            <p>Activated: <span className="text-gray-100">{recharge.activated_at ? formatDateTime(new Date(recharge.activated_at)) : '—'}</span></p>
                            <p>Expiry: <span className="text-gray-100">{recharge.expires_at ? formatDateTime(new Date(recharge.expires_at)) : '—'}</span></p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                            <p>Cashfree Order: <span className="text-gray-100 break-all">{recharge.cashfree_order_id || '—'}</span></p>
                            <p>Cashfree Payment: <span className="text-gray-100 break-all">{recharge.cashfree_payment_id || '—'}</span></p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Included Channels</p>
                            {plan?.channels?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {plan.channels.map((channel) => (
                                  <span key={channel} className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                    {channel}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No channel data available for this plan.</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Price Overrides Modal */}
      {selectedCustForPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl p-5 sm:p-6 overflow-y-auto max-h-[90vh] shadow-2xl border"
               style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Custom Prices</h3>
                <p className="text-xs text-gray-400 mt-1">Configure special plan pricing for <span className="text-amber-400 font-semibold">{selectedCustForPrice.name}</span></p>
              </div>
              <button onClick={() => setSelectedCustForPrice(null)} className="text-gray-400 hover:text-white transition-colors text-xl font-bold">
                ✕
              </button>
            </div>

            {/* Existing Overrides List */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Active Price Overrides</h4>
              {loadingOverrides ? (
                <div className="flex justify-center py-6">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                       style={{ borderColor: '#e63946', borderTopColor: 'transparent' }}></div>
                </div>
              ) : overrides.length === 0 ? (
                <p className="text-xs text-gray-500 py-3 italic bg-white/5 border border-white/5 rounded-xl px-4 text-center">
                  No custom prices configured for this customer yet. They will pay standard regular prices.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {overrides.map((ov) => (
                    <div key={ov.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-xl bg-white/5 border border-white/10 text-sm gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{ov.plan_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Regular: ₹{(ov.plan_price / 100).toFixed(0)} • <span className="text-green-400 font-medium">Custom: ₹{(ov.custom_price / 100).toFixed(0)}</span>
                        </p>
                        {ov.note && <p className="text-xs text-indigo-300 italic mt-0.5 break-words">Note: {ov.note}</p>}
                      </div>
                      <button onClick={() => handleDeleteOverride(ov.plan_id)} className="text-xs font-bold text-red-400 hover:text-red-300 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 transition-all w-full sm:w-auto text-center">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Set New Override Form */}
            <div className="border-t border-white/10 pt-5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Add / Update Custom Price</h4>
              <form onSubmit={handleSaveOverride} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Select Plan</label>
                    <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white border"
                            style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
                      <option value="" disabled className="bg-slate-900 text-gray-400">-- Choose Plan --</option>
                      {plans.filter(p => p.is_active).map((p) => (
                        <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                          {p.name} (Regular: ₹{p.price / 100})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Custom Price (₹)</label>
                    <input type="number" step="0.01" value={customPriceVal} onChange={(e) => setCustomPriceVal(e.target.value)}
                           placeholder="Enter custom rate e.g. 150" required
                           className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white border"
                           style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-2">Admin Note (optional)</label>
                  <input type="text" value={noteVal} onChange={(e) => setNoteVal(e.target.value)}
                         placeholder="e.g. Special area price discount"
                         className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white border"
                         style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }} />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
                  <button type="button" onClick={() => setSelectedCustForPrice(null)}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all bg-white/5 border border-white/10 w-full sm:w-auto text-center order-2 sm:order-1">
                    Close
                  </button>
                  <button type="submit" disabled={savingOverride}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50 w-full sm:w-auto text-center order-1 sm:order-2"
                          style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                    {savingOverride ? 'Saving...' : 'Apply Custom Price'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Activate Plan Modal */}
      {selectedCustForPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl p-5 sm:p-6 overflow-y-auto max-h-[90vh] shadow-2xl border animate-scaleIn"
               style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Activate Plan</h3>
                <p className="text-xs text-gray-400 mt-1">Directly activate a package for <span className="text-amber-400 font-semibold">{selectedCustForPlan.name}</span></p>
              </div>
              <button onClick={() => setSelectedCustForPlan(null)} className="text-gray-400 hover:text-white transition-colors text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleActivatePlanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Select Plan to Activate</label>
                <select value={selectedPlanToActivate} onChange={(e) => handlePlanChange(e.target.value)} required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white border"
                        style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}>
                  <option value="" disabled className="bg-slate-900 text-gray-400">-- Choose Plan --</option>
                  {plans.filter(p => p.is_active).map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-950 text-white">
                      {p.name} (₹{p.price / 100} • {p.duration_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white border"
                  style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                />
                <p className="text-[10px] text-gray-400 mt-1">Defaults to standard validity duration. Modify as needed.</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setSelectedCustForPlan(null)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all bg-white/5 border border-white/10 w-full sm:w-auto text-center">
                  Cancel
                </button>
                <button type="submit" disabled={activatingPlan}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50 w-full sm:w-auto text-center"
                        style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                  {activatingPlan ? 'Activating...' : 'Activate Plan Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedCustForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl p-5 sm:p-6 overflow-y-auto max-h-[90vh] shadow-2xl border animate-scaleIn"
               style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-display text-xl font-bold text-white">Reset PIN / Password</h3>
                <p className="text-xs text-gray-400 mt-1">Set a new login PIN for <span className="text-amber-400 font-semibold">{selectedCustForReset.name}</span></p>
              </div>
              <button onClick={() => setSelectedCustForReset(null)} className="text-gray-400 hover:text-white transition-colors text-xl font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">New 4-digit PIN</label>
                <input
                  type="password"
                  pattern="\d{4,}"
                  placeholder="e.g. 1234"
                  value={newPinVal}
                  onChange={(e) => setNewPinVal(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-white border"
                  style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
                />
                <p className="text-[10px] text-gray-400 mt-1">PIN must be at least 4 digits.</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setSelectedCustForReset(null)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all bg-white/5 border border-white/10 w-full sm:w-auto text-center">
                  Cancel
                </button>
                <button type="submit" disabled={resettingPin}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50 w-full sm:w-auto text-center"
                        style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                  {resettingPin ? 'Resetting...' : 'Reset PIN Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Due Modal */}
      {selectedCustForDues && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl border"
               style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Outstanding Due</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedCustForDues.name}</p>
              </div>
              <button onClick={() => setSelectedCustForDues(null)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Due Amount (₹ rupees)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={duesAmount}
                  onChange={(e) => setDuesAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(230,57,70,0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <p className="text-xs text-gray-500 mt-1">0 enter karo to due clear karo</p>
              </div>

              {selectedCustForDues.outstanding_balance > 0 && (
                <div className="rounded-xl px-4 py-3 text-sm"
                     style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.25)' }}>
                  <span className="text-red-400">Current due: </span>
                  <span className="font-bold text-red-300">₹{selectedCustForDues.outstanding_balance}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {selectedCustForDues.outstanding_balance > 0 && (
                  <button
                    onClick={() => { setDuesAmount('0'); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
                    Mark Paid (Clear)
                  </button>
                )}
                <button
                  onClick={handleSaveDue}
                  disabled={savingDues || duesAmount === ''}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                  {savingDues ? 'Saving...' : 'Save Due'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {selectedCustForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl border"
               style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Edit Customer</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedCustForEdit.name}</p>
              </div>
              <button onClick={() => setSelectedCustForEdit(null)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'Full name' },
                { label: 'Mobile', key: 'mobile', type: 'tel', placeholder: '10-digit mobile' },
                { label: 'STB Number', key: 'stb_number', type: 'text', placeholder: 'Set-top box number' },
                { label: 'Area', key: 'area', type: 'text', placeholder: 'Area/locality' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className={labelStyle}>{label}</label>
                  <input
                    type={type}
                    value={editForm[key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    maxLength={key === 'mobile' ? 10 : undefined}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelectedCustForEdit(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all bg-white/5 border border-white/10">
                  Cancel
                </button>
                <button onClick={handleSaveEdit} disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {selectedCustForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl border"
               style={{ background: '#121214', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Admin Notes</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedCustForNotes.name}</p>
              </div>
              <button onClick={() => setSelectedCustForNotes(null)} className="text-gray-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelStyle}>Note</label>
                <textarea
                  rows={4}
                  value={notesVal}
                  onChange={(e) => setNotesVal(e.target.value)}
                  placeholder="e.g. Frequently delays payment. Needs follow-up."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all resize-none"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <p className="text-xs text-gray-500 mt-1">Sirf admin ko dikhega. Blank karo to note delete hoga.</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setSelectedCustForNotes(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all bg-white/5 border border-white/10">
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  {savingNotes ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

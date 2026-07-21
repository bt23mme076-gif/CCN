'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface RechargeItem {
  recharge: { id: string; plan_name: string; amount: number; status: string; created_at: string; cashfree_order_id: string | null; };
  customer: { id: string; name: string; mobile: string; stb_number?: string; area?: string; };
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
  } | null;
  recharges: CustomerDetailRecharge[];
}

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };

export default function AllRechargesPage() {
  const [recharges, setRecharges] = useState<RechargeItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetailResponse | null>(null);
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false);
  const [customerDetailError, setCustomerDetailError] = useState('');

  useEffect(() => { fetchRecharges(); }, [search]); // eslint-disable-line

  const fetchRecharges = async () => {
    try {
      const url = search ? `/api/admin/recharges?search=${encodeURIComponent(search)}` : '/api/admin/recharges';
      const data = await (await fetch(url)).json();
      setRecharges(data.recharges || []);
    } catch { setRecharges([]); }
    finally { setLoading(false); }
  };

  const handleActivate = async (rechargeId: string) => {
    setActivating(rechargeId);
    try {
      const response = await fetch(`/api/admin/recharges/${rechargeId}/activate`, { method: 'POST' });
      if (response.ok) fetchRecharges();
      else alert('Failed to activate recharge');
    } catch { alert('Failed to activate recharge'); }
    finally { setActivating(null); }
  };

  const handleDelete = async (rechargeId: string) => {
    if (!confirm('Are you sure you want to delete this recharge attempt?')) return;
    setDeleting(rechargeId);
    try {
      const response = await fetch(`/api/admin/recharges/${rechargeId}`, { method: 'DELETE' });
      if (response.ok) fetchRecharges();
      else alert('Failed to delete recharge attempt');
    } catch { alert('Failed to delete recharge attempt'); }
    finally { setDeleting(null); }
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

  const handleShareReceipt = async (
    rechargeId: string,
    planName: string,
    amount: number,
    status: string,
    customerName: string,
    stb: string,
    mobile: string,
    activatedAt?: string | null,
    expiresAt?: string | null,
  ) => {
    if (sharing) return;
    setSharing(rechargeId);

    const amountRs = (amount / 100).toFixed(2);
    const receiptUrl = `/api/admin/receipt/${rechargeId}`;

    const phone = mobile.replace(/\D/g, '').replace(/^0/, '');
    const waPhone = phone.startsWith('91') ? phone : `91${phone}`;

    const msg =
      `Hello ${customerName} 😊\n\n` +
      `✅ *Thank you for doing business with us!*\n\n` +
      `📋 *CCN Networks - Payment Receipt*\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 Customer: ${customerName}\n` +
      `📱 Mobile: ${mobile}\n` +
      `📺 STB No: ${stb}\n` +
      `📡 Plan: ${planName}\n` +
      `💰 Amount: ₹${amountRs}\n` +
      `📊 Status: ${status.toUpperCase()}\n` +
      (activatedAt ? `🗓️ Activated: ${new Date(activatedAt).toLocaleDateString('en-IN')}\n` : '') +
      (expiresAt ? `⏳ Valid Till: ${new Date(expiresAt).toLocaleDateString('en-IN')}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `_CCN Networks — Your Trusted Cable Provider_ 🙏`;

    const ua = navigator.userAgent;
    const isAndroidWebView = /wv\b/.test(ua) || (/Android/.test(ua) && /Version\/\d/.test(ua) && !/Chrome\//.test(ua));

    if (isAndroidWebView) {
      // WebView: navigator.share and wa.me both fail — use Android Intent URL to launch WhatsApp directly
      setSharing(null);
      window.location.href =
        `intent://send?phone=${waPhone}&text=${encodeURIComponent(msg)}` +
        `#Intent;package=com.whatsapp;scheme=whatsapp;end`;
      return;
    }

    // Try file sharing (mobile native share sheet — works in real browsers)
    if (navigator.share) {
      try {
        const res = await fetch(receiptUrl, { credentials: 'include' });
        if (res.ok) {
          const blob = await res.blob();
          const file = new File(
            [blob],
            `CCN-Receipt-${customerName.replace(/\s+/g, '-')}-${rechargeId.slice(0, 8)}.html`,
            { type: 'text/html' },
          );
          const shareData = navigator.canShare && navigator.canShare({ files: [file] })
            ? { title: `CCN Receipt — ${customerName}`, text: msg, files: [file] }
            : { title: `CCN Receipt — ${customerName}`, text: msg };
          await navigator.share(shareData);
          setSharing(null);
          return;
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') { setSharing(null); return; }
      }
    }

    // Desktop fallback: open in new tab
    setSharing(null);
    const a = document.createElement('a');
    a.href = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">All Recharges</h1>

      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="p-4 sm:p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or mobile..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
          </div>
        ) : recharges.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No recharges found</p>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full admin-table">
                <thead>
                  <tr>
                    <th>Customer</th><th>Mobile</th><th>Plan</th>
                    <th>Amount</th><th>Date</th><th>Status</th><th>Action</th><th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {recharges.map(({ recharge, customer }) => (
                    <tr key={recharge.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => openCustomerDetails(customer.id)}
                          className="font-medium text-white text-left hover:text-amber-300 transition-colors underline decoration-dotted underline-offset-4"
                        >
                          {customer.name}
                        </button>
                      </td>
                      <td className="text-gray-400">{customer.mobile}</td>
                      <td>{recharge.plan_name}</td>
                      <td className="font-semibold text-green-400">{formatCurrency(recharge.amount)}</td>
                      <td className="text-gray-400">{formatDateTime(new Date(recharge.created_at))}</td>
                      <td><StatusBadge status={recharge.status} /></td>
                      <td>
                        <div className="flex gap-2">
                          {(recharge.status === 'paid' || recharge.status === 'pending') && (
                            <button onClick={() => handleActivate(recharge.id)} disabled={activating === recharge.id}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                              style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
                              {activating === recharge.id ? 'Activating...' : recharge.status === 'pending' ? 'Force Activate' : 'Activate'}
                            </button>
                          )}
                          <button onClick={() => handleDelete(recharge.id)} disabled={deleting === recharge.id}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #b70909, #e63946)' }}>
                            {deleting === recharge.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                      <td>
                        {(recharge.status === 'paid' || recharge.status === 'activated') && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/api/admin/receipt/${recharge.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white inline-block hover:opacity-80 transition-opacity"
                              style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}
                            >
                              Receipt
                            </a>
                            <button
                              onClick={() => handleShareReceipt(recharge.id, recharge.plan_name, recharge.amount, recharge.status, customer.name, customer.stb_number || '', customer.mobile || '')}
                              disabled={sharing === recharge.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-80 transition-opacity disabled:opacity-60"
                              style={{ background: 'linear-gradient(135deg, #166534, #16a34a)' }}
                            >
                              {sharing === recharge.id ? '...' : 'Share'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {recharges.map(({ recharge, customer }) => (
                <div key={recharge.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <button
                        type="button"
                        onClick={() => openCustomerDetails(customer.id)}
                        className="font-semibold text-white text-left hover:text-amber-300 transition-colors underline decoration-dotted underline-offset-4"
                      >
                        {customer.name}
                      </button>
                      <p className="text-xs text-gray-400">{customer.mobile}</p>
                    </div>
                    <StatusBadge status={recharge.status} />
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Plan: <span className="text-gray-200">{recharge.plan_name}</span></p>
                    <p>Amount: <span className="text-green-400 font-semibold">{formatCurrency(recharge.amount)}</span></p>
                    <p>Date: {formatDateTime(new Date(recharge.created_at))}</p>
                  </div>
                  {(recharge.status === 'paid' || recharge.status === 'pending') && (
                    <button onClick={() => handleActivate(recharge.id)} disabled={activating === recharge.id}
                      className="w-full py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
                      {activating === recharge.id ? 'Activating...' : recharge.status === 'pending' ? '⚡ Force Activate' : '✓ Activate'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(recharge.id)} disabled={deleting === recharge.id}
                    className="w-full py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #b70909, #e63946)' }}>
                    {deleting === recharge.id ? 'Deleting...' : 'Delete'}
                  </button>
                  {(recharge.status === 'paid' || recharge.status === 'activated') && (
                    <div className="flex gap-2">
                      <a
                        href={`/api/admin/receipt/${recharge.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white text-center block"
                        style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}
                      >
                        Receipt
                      </a>
                      <button
                        onClick={() => handleShareReceipt(recharge.id, recharge.plan_name, recharge.amount, recharge.status, customer.name, customer.stb_number || '', customer.mobile || '')}
                        disabled={sharing === recharge.id}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg, #166534, #16a34a)' }}
                      >
                        {sharing === recharge.id ? 'Sharing...' : 'Share'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer?.name || 'Customer record missing'}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Mobile</p>
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer?.mobile || '—'}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">STB</p>
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer?.stb_number || '—'}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Area</p>
                    <p className="font-semibold text-white">{selectedCustomerDetail.customer?.area || '—'}</p>
                  </div>
                </div>

                {!selectedCustomerDetail.customer && (
                  <p className="text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
                    This customer record is missing, but recharge history is still available for the stored customer id.
                  </p>
                )}

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
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-green-400 font-semibold">{formatCurrency(recharge.amount)}</span>
                              <StatusBadge status={recharge.status} />
                              {(recharge.status === 'paid' || recharge.status === 'activated') && (
                                <>
                                  <a
                                    href={`/api/admin/receipt/${recharge.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                                    style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}
                                  >
                                    Receipt
                                  </a>
                                  <button
                                    onClick={() => handleShareReceipt(recharge.id, recharge.plan_name, recharge.amount, recharge.status, selectedCustomerDetail.customer?.name || '', selectedCustomerDetail.customer?.stb_number || '', selectedCustomerDetail.customer?.mobile || '', recharge.activated_at, recharge.expires_at)}
                                    disabled={sharing === recharge.id}
                                    className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #166534, #16a34a)' }}
                                  >
                                    {sharing === recharge.id ? '...' : 'Share'}
                                  </button>
                                </>
                              )}
                            </div>
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
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import StatusBadge from '@/components/StatusBadge';
import ActivationWaiting from '@/components/ActivationWaiting';
import { formatCurrency, formatDateTime, getDaysRemaining, formatDateDMY, formatDisplayEndDate } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  stb_number: string;
  area: string;
  outstanding_balance: number;
}

interface Recharge {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  created_at: string;
  activated_at: string | null;
  expires_at: string | null;
  cashfree_order_id: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivationScreen, setShowActivationScreen] = useState(false);
  const [justPaidRecharge, setJustPaidRecharge] = useState<Recharge | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showRetrackPopup, setShowRetrackPopup] = useState(false);
  const [retrackLoading, setRetrackLoading] = useState(false);
  const [retrackDone, setRetrackDone] = useState(false);
  const [retrackStb, setRetrackStb] = useState('');
  const [retrackEdited, setRetrackEdited] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  useEffect(() => {
    fetchData();
    checkPaymentStatus();
    registerPush();
    const onConnectionChanged = () => fetchData();
    window.addEventListener('ccn-connection-changed', onConnectionChanged);
    return () => window.removeEventListener('ccn-connection-changed', onConnectionChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) { await sendSubscription(existing); return; }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      await sendSubscription(sub);
    } catch { /* ignore */ }
  };

  const sendSubscription = async (sub: PushSubscription) => {
    const json = sub.toJSON();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
    });
  };

  const checkPaymentStatus = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');

    if (orderId) {
      try {
        const verifyResponse = await fetch('/api/recharge/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          // Fetch recharges to find the just-paid one
          const rechargesRes = await fetch('/api/recharge/history', { cache: 'no-store' });
          const rechargesData = await rechargesRes.json();
          const paid = (rechargesData.recharges || []).find(
            (r: Recharge) => r.status === 'paid'
          );
          if (paid) {
            setJustPaidRecharge(paid);
            setShowActivationScreen(true);
          }
        } else if (verifyData.cancelled) {
          setPaymentError('Payment cancelled. Your recharge was not processed.');
        } else {
          setPaymentError('Payment verification failed. Please contact support if amount was deducted.');
        }
      } catch {
        setPaymentError('Unable to verify payment. Please contact support if amount was deducted.');
      } finally {
        window.history.replaceState({}, '', '/dashboard');
        setTimeout(() => fetchData(), 1000);
      }
    }
  };

  const fetchData = async () => {
    const cid = typeof window !== 'undefined' ? localStorage.getItem('ccn_active_cid') : null;
    const cidParam = cid ? `?cid=${cid}` : '';
    try {
      const [customerRes, rechargesRes] = await Promise.all([
        fetch(`/api/auth/me${cidParam}`),
        fetch(`/api/recharge/history${cidParam}`),
      ]);

      if (!customerRes.ok) {
        router.push('/login');
        return;
      }

      const customerData = await customerRes.json();
      const rechargesData = await rechargesRes.json();

      setCustomer(customerData.customer);
      setRecharges(rechargesData.recharges || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setRecharges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleRetrackRequest = async () => {
    const stbToSend = retrackEdited ? retrackStb : (customer?.stb_number || '');
    if (!stbToSend) return;
    setRetrackLoading(true);
    try {
      await fetch('/api/retrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stb_number: stbToSend }),
      });
      setRetrackDone(true);
    } catch { /* ignore */ }
    finally { setRetrackLoading(false); }
  };

  const activePlan = recharges.find(
    (r) => r.status === 'activated' && r.expires_at && new Date(r.expires_at) > new Date() && !r.plan_name.toUpperCase().startsWith('ALA CARTE')
  );

  const pendingActivation = recharges.find(r => r.status === 'paid');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
      </div>
    );
  }

  // Show full-screen activation waiting screen after successful payment
  if (showActivationScreen && justPaidRecharge) {
    return (
      <ActivationWaiting
        rechargeId={justPaidRecharge.id}
        planName={justPaidRecharge.plan_name}
        amount={justPaidRecharge.amount}
        hasActivePlan={!!activePlan}
        activePlanExpiry={activePlan?.expires_at ?? null}
        onActivated={() => {
          setShowActivationScreen(false);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <nav className="sticky top-0 z-30 shadow-lg" style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #1a1a4e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)' }} />
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg blur-sm opacity-60 group-hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #e94560, #f5a623)' }} />
                <Image src="/logo.jpg" alt="CCN Cable" width={40} height={40} className="relative h-10 w-10 rounded-lg object-cover border border-white/20" />
              </div>
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-wide text-white">CCN Networks</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm hidden sm:flex items-center gap-1.5" style={{ color: '#93c5fd' }}>
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse" />
                Hi, <span className="text-white font-semibold">{customer?.name}</span>
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowNavMenu((p) => !p)}
                  className="flex flex-col gap-1.5 justify-center items-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <span className="block w-4 h-0.5 bg-white rounded-full" />
                  <span className="block w-4 h-0.5 bg-white rounded-full" />
                  <span className="block w-4 h-0.5 bg-white rounded-full" />
                </button>
                {showNavMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNavMenu(false)} />
                    <div className="absolute right-0 top-11 z-50 w-52 rounded-xl shadow-2xl py-1 overflow-hidden"
                      style={{ background: '#1a1740', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <div className="px-4 py-2.5 sm:hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-xs text-blue-300">Logged in as</p>
                        <p className="text-sm font-semibold text-white">{customer?.name}</p>
                      </div>
                      <Link href="/" onClick={() => setShowNavMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors">
                        <span>🏠</span> Home
                      </Link>
                      <Link href="/dashboard" onClick={() => setShowNavMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors">
                        <span>📊</span> Dashboard
                      </Link>
                      <Link href="/dashboard/buy" onClick={() => setShowNavMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors">
                        <span>💳</span> Buy & History
                      </Link>
                      <button onClick={() => { setShowNavMenu(false); setRetrackDone(false); setRetrackStb(customer?.stb_number || ''); setRetrackEdited(false); setShowRetrackPopup(true); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
                        <span>📺</span> Request Retrack
                      </button>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="my-1" />
                      <button onClick={() => { setShowNavMenu(false); handleLogout(); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-colors w-full text-left">
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Payment Error Message */}
        {paymentError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm font-medium flex-1">{paymentError}</p>
              <button onClick={() => setPaymentError(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Outstanding Due Banner */}
        {customer && customer.outstanding_balance > 0 && (
          <div className="mb-6 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 24px rgba(220,38,38,0.35)' }}>
            <div className="flex items-center gap-4 px-5 py-4"
              style={{ background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm sm:text-base leading-tight">
                  Outstanding Due: <span className="text-yellow-300">₹{customer.outstanding_balance}</span>
                </p>
                <p className="text-xs text-red-100 mt-0.5">
                  Recharge is blocked. Contact CCN Networks to clear your dues.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Info */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-2">
                {customer?.name}
              </h2>
              <div className="space-y-1 text-sm sm:text-base text-gray-600">
                <p>Mobile: {customer?.mobile}</p>
                <p>STB Number: {customer?.stb_number}</p>
                <p>Area: {customer?.area}</p>
              </div>
            </div>
          </div>
        </div>


        {/* Retrack Popup */}
        {showRetrackPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={(e) => { if (e.target === e.currentTarget && retrackDone) { setShowRetrackPopup(false); } }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
              {retrackDone ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                  <p className="text-sm text-gray-600 mb-5">
                    Keep your STB and TV <span className="font-bold text-green-600">ON</span> for the next 5 minutes.
                  </p>
                  <button
                    onClick={() => setShowRetrackPopup(false)}
                    className="w-full py-3 rounded-xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #1a1a40, #2d2b69)' }}>
                    OK, Got It
                  </button>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-3">📺</div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Request Retrack</h3>
                  <div className="text-left mb-5">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">STB Number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={retrackEdited ? retrackStb : (customer?.stb_number || '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setRetrackEdited(true);
                        setRetrackStb(digits);
                      }}
                      onKeyDown={(e) => {
                        if (!retrackEdited && e.key !== 'Tab' && e.key !== 'Enter') {
                          setRetrackEdited(true);
                          setRetrackStb('');
                        }
                      }}
                      placeholder="Enter your STB number"
                      className="w-full px-4 py-3 rounded-xl border text-sm font-mono text-gray-800 outline-none transition-colors"
                      style={{ borderColor: retrackEdited ? '#3b82f6' : '#e5e7eb' }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRetrackPopup(false)}
                      className="flex-1 py-3 rounded-xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleRetrackRequest}
                      disabled={retrackLoading || !retrackStb.trim()}
                      className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #e63946, #c0392b)' }}>
                      {retrackLoading ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pending Activation Notice */}
        {pendingActivation && (
          <div className="card mb-6 sm:mb-8" style={{
            background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
            border: '1px solid rgba(139,92,246,0.3)',
          }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl animate-pulse">📺</span>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Activation In Progress</h3>
                  <p className="text-sm text-blue-200">
                    <strong className="text-white">{pendingActivation.plan_name}</strong> ({formatCurrency(pendingActivation.amount)}) — Payment confirmed. Keep your TV on!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setJustPaidRecharge(pendingActivation);
                  setShowActivationScreen(true);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #e94560, #c0392b)' }}
              >
                View Status
              </button>
            </div>
          </div>
        )}

        {/* Active Plan */}
        <div className="card bg-brand-navy text-white mb-6 sm:mb-8">
          {activePlan ? (
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold mb-4">Active Plan</h3>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
                <div className="flex-1 w-full">
                  <p className="text-xl sm:text-2xl font-bold mb-4">{activePlan.plan_name}</p>
                  <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm border-t border-indigo-950 pt-4">
                    <div>
                      <p className="text-gray-400 mb-1">Start Date</p>
                      <p className="font-semibold text-white">
                        {formatDateDMY(activePlan.activated_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">End Date</p>
                      <p className="font-semibold text-white">
                        {formatDisplayEndDate(activePlan.expires_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Effective Date</p>
                      <p className="font-semibold text-white">
                        {formatDateDMY(activePlan.activated_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center sm:text-right flex-shrink-0 self-center sm:self-start">
                  <div className="text-4xl sm:text-5xl font-bold text-accent-red mb-1">
                    {getDaysRemaining(new Date(activePlan.expires_at!))}
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">days left</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <h3 className="font-display text-xl sm:text-2xl font-bold mb-3 sm:mb-4">No Active Plan</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6 px-4">
                Recharge now to continue enjoying your favorite channels
              </p>
              <Link
                href="/plans"
                className="inline-block bg-accent-red text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Recharge Now
              </Link>
            </div>
          )}
        </div>

        {activePlan && (
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/plans"
              className="btn-primary flex-1 text-center"
            >
              Recharge Now
            </Link>
            <Link
              href="/dashboard/buy"
              className="bg-accent-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex-1 text-center"
            >
              View Buy & History
            </Link>
          </div>
        )}

        {!activePlan && (
          <div className="mb-6 sm:mb-8 text-center">
            <Link
              href="/dashboard/buy"
              className="btn-primary inline-block w-full sm:w-auto"
            >
              Browse Plans & History
            </Link>
          </div>
        )}

        {/* Recharge History */}
        <div className="card">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-4 sm:mb-6">
            Recharge History
          </h3>

          {recharges.length === 0 ? (
            <p className="text-gray-600 text-center py-8 text-sm sm:text-base">No recharge history yet</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Plan</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm hidden md:table-cell">Order ID</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Date</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Amount</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Status</th>
                      <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-700 text-xs sm:text-sm">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recharges.map((recharge) => (
                      <tr key={recharge.id} className="border-b last:border-b-0">
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">{recharge.plan_name}</td>
                        <td className="py-3 px-2 sm:px-4 text-xs text-gray-600 hidden md:table-cell">
                          {recharge.id}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">
                          {formatDateTime(new Date(recharge.created_at))}
                        </td>
                        <td className="py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm">
                          {formatCurrency(recharge.amount)}
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <StatusBadge status={recharge.status} />
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          {(recharge.status === 'paid' || recharge.status === 'activated') && (
                            <a
                              href={`/api/receipt/${recharge.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-600 hover:underline whitespace-nowrap"
                            >
                              Download
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

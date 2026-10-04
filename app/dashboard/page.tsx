'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { portalBg, GlassCard, SectionTitle, StatusPill, DaysRing, accentGradient } from '@/components/PortalUI';
import ActivationWaiting from '@/components/ActivationWaiting';
import { formatCurrency, formatDateTime, getDaysRemaining, formatDateDMY, formatDisplayEndDate } from '@/lib/utils';
import { useOperatorBranding } from '@/lib/useOperatorBranding';

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
}

export default function DashboardPage() {
  const router = useRouter();
  const branding = useOperatorBranding();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivationScreen, setShowActivationScreen] = useState(false);
  const [justPaidRecharge, setJustPaidRecharge] = useState<Recharge | null>(null);
  const [paymentHasActivePlan, setPaymentHasActivePlan] = useState(false);
  const [paymentActivePlanExpiry, setPaymentActivePlanExpiry] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showRetrackPopup, setShowRetrackPopup] = useState(false);
  const [retrackLoading, setRetrackLoading] = useState(false);
  const [retrackDone, setRetrackDone] = useState(false);
  const [retrackStb, setRetrackStb] = useState('');
  const [retrackEdited, setRetrackEdited] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [connections, setConnections] = useState<{ id: string; stb_number: string; label: string | null; isActive: boolean }[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState('primary');

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
    const type = urlParams.get('type');
    const isDue = type === 'due';
    const payment = urlParams.get('payment');

    if (payment) {
      alert(
        payment === 'failed'
          ? 'Payment failed or was cancelled. If money was deducted, it will be refunded by your bank — please try again.'
          : 'Payment successful! Your operator will deliver the accessory soon.'
      );
      window.history.replaceState({}, '', '/dashboard');
      return;
    }

    if (!orderId) return;

    try {
      // Payment is already marked 'paid' server-side at UTR-submission time —
      // just look it up rather than re-verifying with a gateway.
      const cid = typeof window !== 'undefined' ? localStorage.getItem('ccn_active_cid') : null;
      const cidParam = cid && cid !== 'primary' ? `?cid=${cid}` : '';
      const rechargesRes = await fetch(`/api/recharge/history${cidParam}`, { cache: 'no-store' });
      const rechargesData = await rechargesRes.json();
      const all: Recharge[] = rechargesData.recharges || [];
      const match = all.find((r) => r.id === orderId);

      if (isDue) {
        if (match?.status === 'paid') {
          alert('Due amount paid successfully! You can now recharge.');
        }
      } else if (match?.status === 'paid') {
        const existingActive = all.find(
          (r) => r.status === 'activated' && r.expires_at && new Date(r.expires_at) > new Date() && !r.plan_name.toUpperCase().startsWith('ALA CARTE')
        );
        setJustPaidRecharge(match);
        setPaymentHasActivePlan(!!existingActive);
        setPaymentActivePlanExpiry(existingActive?.expires_at ?? null);
        setShowActivationScreen(true);
      } else if (match?.status === 'failed') {
        setPaymentError('Payment failed ya cancel ho gaya. Please try again.');
      }
    } catch { /* ignore, dashboard will still load normally */ }
    finally {
      window.history.replaceState({}, '', '/dashboard');
      setTimeout(() => fetchData(), 1000);
    }
  };

  const switchConnection = (id: string) => {
    localStorage.setItem('ccn_active_cid', id);
    window.location.reload();
  };

  const fetchData = async () => {
    const cid = typeof window !== 'undefined' ? localStorage.getItem('ccn_active_cid') : null;
    const cidParam = cid ? `?cid=${cid}` : '';
    setActiveConnectionId(cid || 'primary');
    try {
      const [customerRes, rechargesRes, connsRes] = await Promise.all([
        fetch(`/api/auth/me${cidParam}`),
        fetch(`/api/recharge/history${cidParam}`),
        fetch('/api/connections'),
      ]);

      if (!customerRes.ok) {
        router.push('/login');
        return;
      }

      const customerData = await customerRes.json();
      const rechargesData = await rechargesRes.json();
      if (connsRes.ok) {
        const connsData = await connsRes.json();
        setConnections(connsData.connections || []);
      }

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

  // Match buy/history's "next expiring plan" logic: among active plans, show
  // the one expiring soonest — not just whichever comes first in the list
  // (which could be a future pre-paid renewal instead of the current plan).
  const activePlan = recharges
    .filter((r) => r.status === 'activated' && r.expires_at && new Date(r.expires_at) > new Date() && !r.plan_name.toUpperCase().startsWith('ALA CARTE'))
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())[0];

  const pendingActivation = recharges.find(r => r.status === 'paid');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={portalBg}>
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
        hasActivePlan={paymentHasActivePlan}
        activePlanExpiry={paymentActivePlanExpiry}
        isGtpl={!!customer?.stb_number.startsWith('3')}
        onActivated={() => {
          setShowActivationScreen(false);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen" style={portalBg}>
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
                <Image src={branding.logo_url || '/logo.jpg'} alt={branding.name} width={40} height={40} className="relative h-10 w-10 rounded-lg object-cover border border-white/20" />
              </div>
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-wide text-white uppercase">{branding.name}</span>
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
                      {connections.length > 1 && (
                        <>
                          <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>My Connections</p>
                          {connections.map((conn) => (
                            <button key={conn.id} onClick={() => switchConnection(conn.id)}
                              className="flex items-center justify-between gap-2 px-4 py-2 text-sm w-full text-left transition-colors hover:bg-white/10"
                              style={{ color: activeConnectionId === conn.id ? '#4ade80' : '#93c5fd' }}>
                              <span className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conn.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                                {conn.stb_number}{conn.label ? ` · ${conn.label}` : ''}
                              </span>
                              {activeConnectionId === conn.id && <span className="text-green-400 text-xs">✓</span>}
                            </button>
                          ))}
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="my-1" />
                        </>
                      )}
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Payment Error Message */}
        {paymentError && (
          <div className="mb-5 p-4 rounded-2xl flex items-start gap-3"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
            <span className="text-red-400 text-lg leading-none">⚠</span>
            <p className="text-sm font-medium flex-1 text-red-200">{paymentError}</p>
            <button onClick={() => setPaymentError(null)} className="text-red-300/70 hover:text-white text-lg leading-none">✕</button>
          </div>
        )}

        {/* Greeting + account details */}
        <div className="mb-5 sm:mb-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-1.5" style={{ color: '#f5d27a' }}>My Account</p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white mb-4">
            Namaste, {customer?.name?.split(' ')[0]} 👋
          </h1>
          <div className="flex flex-wrap gap-2">
            {[
              { k: 'STB', v: customer?.stb_number },
              { k: 'Mobile', v: customer?.mobile },
              { k: 'Area', v: customer?.area },
            ].map(({ k, v }) => (
              <span key={k} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="text-gray-400 uppercase tracking-wider font-semibold">{k}</span>
                <span className="text-white font-semibold font-mono">{v}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Outstanding Due Banner */}
        {customer && customer.outstanding_balance > 0 && (
          <div className="mb-5 rounded-2xl p-4 sm:p-5 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.22), rgba(127,29,29,0.25))', border: '1px solid rgba(248,113,113,0.35)', boxShadow: '0 8px 30px rgba(220,38,38,0.2)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.2)' }}>
              <span className="text-xl">💰</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider font-semibold text-red-300">Outstanding Due</p>
              <p className="text-2xl font-extrabold text-white leading-tight">₹{customer.outstanding_balance}</p>
              <p className="text-xs text-red-200/80 mt-0.5">Ye amount aapke next recharge ke payment mein automatically add ho jayega.</p>
            </div>
          </div>
        )}


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
          <div className="mb-5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.14), rgba(99,102,241,0.14))', border: '1px solid rgba(251,191,36,0.3)' }}>
            <div className="flex items-start gap-3 flex-1">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.18)' }}>
                <span className="text-xl animate-pulse">📺</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-amber-300 mb-0.5">Activation In Progress</p>
                <p className="text-sm text-gray-200">
                  <strong className="text-white">{pendingActivation.plan_name}</strong> · {formatCurrency(pendingActivation.amount)} — Payment confirmed. Keep your TV on!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setJustPaidRecharge(pendingActivation);
                setShowActivationScreen(true);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap"
              style={{ background: accentGradient, boxShadow: '0 6px 20px rgba(230,57,70,0.35)' }}
            >
              View Status
            </button>
          </div>
        )}

        {/* Active Plan — hero card */}
        <div className="relative mb-5 sm:mb-6 rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1b1846 0%, #24205c 45%, #15133a 100%)',
            border: '1px solid rgba(245,210,122,0.22)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #f5d27a, #e63946, transparent)' }} />
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(230,57,70,0.25), transparent 70%)' }} />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)' }} />

          <div className="relative p-5 sm:p-8">
            {activePlan ? (() => {
              const daysLeft = getDaysRemaining(new Date(activePlan.expires_at!));
              const start = activePlan.activated_at ? new Date(activePlan.activated_at).getTime() : Date.now();
              const totalDays = Math.max(1, Math.round((new Date(activePlan.expires_at!).getTime() - start) / 86400000));
              return (
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <StatusPill status="activated" label="Active Plan" />
                    </div>
                    <p className="font-display text-2xl sm:text-4xl font-bold text-white mb-5 leading-tight">{activePlan.plan_name}</p>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <div className="rounded-xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">Start Date</p>
                        <p className="font-bold text-white">{formatDateDMY(activePlan.activated_at)}</p>
                      </div>
                      <div className="rounded-xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">End Date</p>
                        <p className="font-bold text-white">{formatDisplayEndDate(activePlan.expires_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="self-center">
                    <DaysRing days={daysLeft} fraction={daysLeft / totalDays} />
                  </div>
                </div>
              );
            })() : (
              <div className="text-center py-4 sm:py-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>📡</div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">No Active Plan</h3>
                <p className="text-sm sm:text-base text-gray-300 max-w-md mx-auto">
                  Recharge now to continue enjoying your favorite channels
                </p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/plans"
                className="text-center px-6 py-3.5 rounded-xl font-bold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
                ⚡ Recharge Now
              </Link>
              <Link href="/dashboard/buy"
                className="text-center px-6 py-3.5 rounded-xl font-semibold text-white transition-colors hover:bg-white/10"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}>
                Buy & History →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent recharges */}
        <GlassCard className="p-5 sm:p-6">
          <SectionTitle
            action={recharges.length > 0 && (
              <Link href="/dashboard/buy" className="text-sm font-semibold hover:underline" style={{ color: '#f5d27a' }}>
                View all →
              </Link>
            )}
          >
            Recent Recharges
          </SectionTitle>

          {recharges.length === 0 ? (
            <p className="text-gray-400 text-center py-10 text-sm">No recharge history yet</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {recharges.slice(0, 5).map((recharge) => {
                const expired = recharge.status === 'activated' && recharge.expires_at && new Date(recharge.expires_at) < new Date();
                return (
                  <div key={recharge.id} className="flex items-center gap-3 sm:gap-4 py-3.5 first:pt-0 last:pb-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                      📺
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base truncate">{recharge.plan_name}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(new Date(recharge.created_at))}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-white">{formatCurrency(recharge.amount)}</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        {(recharge.status === 'paid' || recharge.status === 'activated') && (
                          <a href={`/api/receipt/${recharge.id}`} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] font-semibold hover:underline" style={{ color: '#93c5fd' }}>
                            Receipt
                          </a>
                        )}
                        <StatusPill status={expired ? 'expired' : recharge.status} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

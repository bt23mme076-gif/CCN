'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PlanCard from '@/components/PlanCard';
import PaymentModal from '@/components/PaymentModal';
import AccessoryPaymentModal from '@/components/AccessoryPaymentModal';
import AccessoryCard from '@/components/AccessoryCard';
import { portalBg, glass, GlassCard, StatusPill, accentGradient, goldGradient } from '@/components/PortalUI';
import { formatCurrency, formatDateTime, formatDateDMY, formatDisplayEndDate } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';
import { useOperatorBranding } from '@/lib/useOperatorBranding';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  channels: string[];
  is_popular: boolean;
  isCustomPrice?: boolean;
  discounts?: Record<number, number>;
}

interface Accessory {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

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
  paid_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
}

// Helper function to calculate time remaining
function getTimeRemaining(expiryDate: Date) {
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { expired: true, text: 'Expired', color: 'text-red-600' };
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 7) {
    return { expired: false, text: `${days} days left`, color: 'text-green-600' };
  } else if (days > 3) {
    return { expired: false, text: `${days} days left`, color: 'text-yellow-600' };
  } else if (days > 0) {
    return { expired: false, text: `${days}d ${hours}h left`, color: 'text-orange-600' };
  } else {
    return { expired: false, text: `${hours} hours left`, color: 'text-red-600' };
  }
}

// getTimeRemaining's light-theme classes → readable colors on the dark portal.
const DARK_TIME_COLOR: Record<string, string> = {
  'text-green-600': '#4ade80',
  'text-yellow-600': '#facc15',
  'text-orange-600': '#fb923c',
  'text-red-600': '#f87171',
};

// Helper function to format date in a friendly way
function formatFriendlyDate(date: Date) {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const dateStr = date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  
  const timeStr = date.toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  if (days === 0) {
    return `Today at ${timeStr}`;
  } else if (days === 1) {
    return `Tomorrow at ${timeStr}`;
  } else if (days === -1) {
    return `Yesterday at ${timeStr}`;
  } else if (days > 0 && days <= 7) {
    return `In ${days} days (${dateStr})`;
  } else {
    return `${dateStr} at ${timeStr}`;
  }
}

export default function BuyHistoryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const branding = useOperatorBranding();
  const [activeTab, setActiveTab] = useState<'buy' | 'accessories' | 'history'>('history');
  const [historyType, setHistoryType] = useState<'recharges' | 'accessories'>('recharges');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [accessoriesList, setAccessoriesList] = useState<Accessory[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [accessoryOrdersList, setAccessoryOrdersList] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPlanMonths, setSelectedPlanMonths] = useState(1);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAccessoryModal, setShowAccessoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [connections, setConnections] = useState<{ id: string; stb_number: string; label: string | null; isActive: boolean }[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState('primary');
  const [showRetrackPopup, setShowRetrackPopup] = useState(false);
  const [retrackLoading, setRetrackLoading] = useState(false);
  const [retrackDone, setRetrackDone] = useState(false);
  const [retrackStb, setRetrackStb] = useState('');
  const [retrackEdited, setRetrackEdited] = useState(false);

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
    const onConnectionChanged = (e: Event) => {
      const cid = (e as CustomEvent).detail?.connectionId;
      fetchData(cid || undefined);
    };
    window.addEventListener('ccn-connection-changed', onConnectionChanged);
    return () => window.removeEventListener('ccn-connection-changed', onConnectionChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchConnection = (id: string) => {
    localStorage.setItem('ccn_active_cid', id);
    window.location.reload();
  };

  const fetchData = async (cidOverride?: string) => {
    const cid = cidOverride !== undefined ? cidOverride : (typeof window !== 'undefined' ? localStorage.getItem('ccn_active_cid') : null);
    const cidParam = (cid && cid !== 'primary') ? `?cid=${cid}` : '';
    setActiveConnectionId(cid || 'primary');
    try {
      const [plansRes, customerRes, rechargesRes, accessoriesRes, accOrdersRes, connsRes] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store' }),
        fetch(`/api/auth/me${cidParam}`, { cache: 'no-store' }),
        fetch(`/api/recharge/history${cidParam}`, { cache: 'no-store' }),
        fetch('/api/accessories', { cache: 'no-store' }),
        fetch('/api/accessory/history', { cache: 'no-store' }),
        fetch('/api/connections'),
      ]);

      if (!customerRes.ok) {
        router.push('/login');
        return;
      }

      const plansData = await plansRes.json();
      const customerData = await customerRes.json();
      const rechargesData = await rechargesRes.json();
      const accessoriesData = await accessoriesRes.json();
      const accOrdersData = await accOrdersRes.json();
      if (connsRes.ok) { const d = await connsRes.json(); setConnections(d.connections || []); }

      setPlans(plansData.plans || []);
      setCustomer(customerData.customer);
      setRecharges(rechargesData.recharges || []);
      setAccessoriesList(accessoriesData.accessories || []);
      setAccessoryOrdersList(accOrdersData.orders || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string, months: number = 1) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setSelectedPlanMonths(months);
      setShowPaymentModal(true);
    }
  };

  const handleSelectAccessory = (accId: string) => {
    const accessory = accessoriesList.find((a) => a.id === accId);
    if (accessory) {
      setSelectedAccessory(accessory);
      setShowAccessoryModal(true);
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

  const handleDownloadReceipt = (rechargeId: string) => {
    window.open(`/api/receipt/${rechargeId}`, '_blank');
  };

  const handleShareReceipt = async (recharge: Recharge) => {
    const receiptUrl = `/api/receipt/${recharge.id}`;
    try {
      const res = await fetch(receiptUrl);
      const blob = await res.blob();
      const file = new File([blob], `${recharge.id.slice(0, 8)}-Receipt.html`, { type: 'text/html' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: `${branding.name} Receipt`, files: [file] });
        return;
      }
    } catch { /* fall through */ }
    // Fallback: open receipt in new tab for manual save/print
    window.open(receiptUrl, '_blank');
  };

  const filteredRecharges = filterStatus === 'all'
    ? recharges 
    : recharges.filter(r => r.status === filterStatus);

  // Calculate statistics
  const totalSpent = recharges
    .filter(r => r.status === 'paid' || r.status === 'activated')
    .reduce((sum, r) => sum + r.amount, 0);
  
  const totalRecharges = recharges.length;
  const activeRecharges = recharges.filter(r => {
    if (r.status !== 'activated' || !r.expires_at) return false;
    return new Date(r.expires_at) > currentTime;
  }).length;
  const pendingRecharges = recharges.filter(r => r.status === 'paid').length;

  // Find next expiring plan
  const nextExpiringPlan = recharges
    .filter(r => r.status === 'activated' && r.expires_at && new Date(r.expires_at) > currentTime && !r.plan_name.toUpperCase().startsWith('ALA CARTE'))
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime())[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={portalBg}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={portalBg}>
      {/* Header */}
      <nav className="sticky top-0 z-30 shadow-lg" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #1a1a4e 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
                <button onClick={() => setShowNavMenu((p) => !p)}
                  className="flex flex-col gap-1.5 justify-center items-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                  <span className="block w-4 h-0.5 bg-white rounded-full" />
                  <span className="block w-4 h-0.5 bg-white rounded-full" />
                  <span className="block w-4 h-0.5 bg-white rounded-full" />
                </button>
                {showNavMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNavMenu(false)} />
                    <div className="absolute right-0 top-11 z-50 w-52 rounded-xl shadow-2xl py-1 overflow-hidden" style={{ background: '#1a1740', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <div className="px-4 py-2.5 sm:hidden" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="text-xs text-blue-300">Logged in as</p>
                        <p className="text-sm font-semibold text-white">{customer?.name}</p>
                      </div>
                      <Link href="/" onClick={() => setShowNavMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors"><span>🏠</span> Home</Link>
                      <Link href="/dashboard" onClick={() => setShowNavMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors"><span>📊</span> Dashboard</Link>
                      <Link href="/dashboard/buy" onClick={() => setShowNavMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors"><span>💳</span> Buy & History</Link>
                      <button onClick={() => { setShowNavMenu(false); setRetrackDone(false); setRetrackStb(customer?.stb_number || ''); setRetrackEdited(false); setShowRetrackPopup(true); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors w-full text-left"><span>📺</span> Request Retrack</button>
                      {connections.length > 1 && (
                        <>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="my-1" />
                          <div className="px-4 py-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7c6fa0' }}>My Connections</p>
                          </div>
                          {connections.map((conn) => (
                            <button key={conn.id} onClick={() => switchConnection(conn.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm w-full text-left hover:bg-white/10 transition-colors"
                              style={{ color: activeConnectionId === conn.id ? '#fff' : '#93c5fd' }}>
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conn.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                              <span className="flex-1 truncate">{conn.stb_number} · {conn.label || conn.stb_number}</span>
                              {activeConnectionId === conn.id && <span className="text-green-400 text-xs">✓</span>}
                            </button>
                          ))}
                        </>
                      )}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="my-1" />
                      <button onClick={() => { setShowNavMenu(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-colors w-full text-left"><span>🚪</span> Logout</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold mb-1.5" style={{ color: '#f5d27a' }}>My Account</p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white mb-2">
            Buy Plans & History
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Purchase new plans or view your complete recharge history
          </p>
        </div>

        {/* Outstanding Due Notice — no longer blocks recharge; due gets added to the next plan payment automatically */}
        {customer && customer.outstanding_balance > 0 && (
          <div className="mb-5 rounded-2xl p-4 sm:p-5 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.22), rgba(127,29,29,0.25))', border: '1px solid rgba(248,113,113,0.35)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(248,113,113,0.2)' }}>💰</div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider font-semibold text-red-300">Outstanding Due</p>
              <p className="text-2xl font-extrabold text-white leading-tight">₹{customer.outstanding_balance}</p>
              <p className="text-xs text-red-200/80 mt-0.5">
                Yeh amount aapke next plan ke payment mein automatically add ho jayega — ek hi transaction mein due + recharge dono clear ho jayenge.
              </p>
            </div>
          </div>
        )}

        {/* Next Expiry Alert */}
        {nextExpiringPlan && (() => {
          const remaining = getTimeRemaining(new Date(nextExpiringPlan.expires_at!));
          return (
            <div className="mb-5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(247,127,0,0.16), rgba(230,57,70,0.12))', border: '1px solid rgba(247,127,0,0.3)' }}>
              <div className="flex items-start gap-3 flex-1">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(247,127,0,0.2)' }}>⏳</div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-orange-300 mb-0.5">Next Plan Expiry</p>
                  <p className="text-sm text-gray-200">
                    <span className="font-bold text-white">{nextExpiringPlan.plan_name}</span> expires{' '}
                    <span className="font-semibold text-white">{formatFriendlyDate(new Date(nextExpiringPlan.expires_at!))}</span>
                    {' · '}
                    <span className="font-bold" style={{ color: DARK_TIME_COLOR[remaining.color] || '#e5e7eb' }}>{remaining.text}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('buy')}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white whitespace-nowrap"
                style={{ background: accentGradient, boxShadow: '0 6px 20px rgba(230,57,70,0.35)' }}
              >
                Renew Now
              </button>
            </div>
          );
        })()}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'Total Spent', value: formatCurrency(totalSpent), color: '#60a5fa', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Active Plans', value: activeRecharges, color: '#4ade80', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Activating', value: pendingRecharges, color: '#fbbf24', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Total Orders', value: totalRecharges, color: '#c084fc', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          ].map((s) => (
            <GlassCard key={s.label} className="p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${s.color}33, transparent 70%)` }} />
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${s.color}1f`, border: `1px solid ${s.color}40` }}>
                <svg className="w-4 h-4" fill="none" stroke={s.color} strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white leading-none mb-1">{s.value}</p>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Tabs */}
        <div className="rounded-2xl p-1.5 mb-6 sm:mb-8 flex gap-1" style={glass}>
          {[
            { key: 'buy', label: 'Buy Plans', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
            { key: 'accessories', label: t('buyAccessories'), icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
            { key: 'history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'buy' | 'accessories' | 'history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.key ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={activeTab === tab.key ? { background: accentGradient, boxShadow: '0 6px 18px rgba(230,57,70,0.35)' } : undefined}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Buy Tab Content */}
        {activeTab === 'buy' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                Available Plans
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Choose a plan and make instant payment
              </p>
            </div>

            {plans.length === 0 ? (
              <div className="rounded-2xl text-center py-12" style={glass}>
                <p className="text-gray-400">No plans available at the moment.</p>
              </div>
            ) : (
              <>
                {/* Test Plan */}
                {plans.filter(p => p.price === 100).length > 0 && (
                  <div className="max-w-md mx-auto mb-8">
                    <div className="rounded-2xl p-4 sm:p-6" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.35)' }}>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-300 font-bold text-sm sm:text-base">Test Payment Gateway</span>
                      </div>
                      {plans.filter(p => p.price === 100).map((plan) => (
                        <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                      ))}
                      <p className="text-center text-xs sm:text-sm text-gray-400 mt-3">
                        Try our payment system with just ₹1 • Perfect for testing
                      </p>
                    </div>
                  </div>
                )}

                {/* Regular Plans */}
                <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-12 md:gap-6 max-w-6xl mx-auto py-12 px-4">
                  {plans.filter(p => p.price !== 100).map((plan, index) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      index={index}
                      onSelect={handleSelectPlan}
                      discounts={plan.discounts}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Buy Accessories Tab Content */}
        {activeTab === 'accessories' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
                CCN Accessories & Hardware
              </h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Order accessories and have them delivered to your address
              </p>
            </div>

            {accessoriesList.length === 0 ? (
              <div className="rounded-2xl text-center py-12" style={glass}>
                <p className="text-gray-400">No accessories available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {accessoriesList.map((item) => (
                  <AccessoryCard key={item.id} item={item} onSelect={handleSelectAccessory} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Purchase History
              </h2>

              {/* History Sub-selector */}
              <div className="flex p-1 rounded-xl self-start" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {([['recharges', 'Recharges'], ['accessories', t('accessories')]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setHistoryType(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      historyType === key ? 'text-gray-900' : 'text-gray-400 hover:text-white'
                    }`}
                    style={historyType === key ? { background: goldGradient } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {historyType === 'recharges' ? (
              <div>
                {/* Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'activated', label: 'Activated' },
                    { key: 'paid', label: 'Activating' },
                    { key: 'pending', label: 'Unpaid' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterStatus(f.key)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                        filterStatus === f.key ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={filterStatus === f.key
                        ? { background: 'rgba(230,57,70,0.2)', border: '1px solid rgba(230,57,70,0.55)' }
                        : { border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {filteredRecharges.length === 0 ? (
                  <div className="rounded-2xl text-center py-14 px-6" style={glass}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: 'rgba(255,255,255,0.06)' }}>🧾</div>
                    <p className="text-gray-400 mb-5 font-medium">
                      {filterStatus === 'all' ? 'No recharge history yet' : 'Is filter mein koi recharge nahi mila'}
                    </p>
                    {filterStatus === 'all' && (
                      <button onClick={() => setActiveTab('buy')}
                        className="px-6 py-3 rounded-xl font-bold text-white"
                        style={{ background: accentGradient }}>
                        Buy Your First Plan
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRecharges.map((recharge) => {
                      const isExpired = !!recharge.expires_at && new Date(recharge.expires_at) < currentTime;
                      const timeRemaining = recharge.expires_at ? getTimeRemaining(new Date(recharge.expires_at)) : null;
                      const remainingColor = timeRemaining ? DARK_TIME_COLOR[timeRemaining.color] : undefined;
                      const accent = isExpired ? '#71717a' : recharge.status === 'activated' ? '#4ade80' : recharge.status === 'paid' ? '#fbbf24' : recharge.status === 'failed' ? '#f87171' : '#94a3b8';

                      return (
                        <div
                          key={recharge.id}
                          className={`rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5 ${isExpired ? 'opacity-60' : ''}`}
                          style={{ ...glass, borderLeft: `3px solid ${accent}` }}
                        >
                          <div className="p-4 sm:p-5">
                            {/* Row 1: Icon + Name + Amount + Status */}
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${accent}1f`, border: `1px solid ${accent}40` }}>
                                <svg className="w-5 h-5" fill="none" stroke={accent} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-sm sm:text-base mb-0.5 truncate">{recharge.plan_name}</h3>
                                <p className="text-[11px] text-gray-500 font-mono truncate">#{recharge.id.slice(0, 18)}…</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-lg sm:text-xl font-extrabold text-white mb-1">{formatCurrency(recharge.amount)}</p>
                                <StatusPill status={isExpired ? 'expired' : recharge.status} />
                              </div>
                            </div>

                            {/* Row 2: Date info + receipt actions */}
                            <div className="mt-4 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                              {recharge.status === 'activated' ? (
                                <>
                                  <div>
                                    <p className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Start</p>
                                    <p className="font-semibold text-gray-200">{formatDateDMY(recharge.activated_at)}</p>
                                  </div>
                                  {recharge.expires_at && (
                                    <div>
                                      <p className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">{isExpired ? 'Expired' : 'End Date'}</p>
                                      <p className="font-bold" style={{ color: isExpired ? '#a1a1aa' : remainingColor || '#e5e7eb' }}>{formatDisplayEndDate(recharge.expires_at)}</p>
                                      {timeRemaining && !isExpired && <p className="text-[11px] font-semibold mt-0.5" style={{ color: remainingColor }}>{timeRemaining.text}</p>}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Created</p>
                                    <p className="font-semibold text-gray-200">{formatDateTime(new Date(recharge.created_at))}</p>
                                  </div>
                                  {recharge.paid_at && (
                                    <div>
                                      <p className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Paid</p>
                                      <p className="font-semibold text-gray-200">{formatDateTime(new Date(recharge.paid_at))}</p>
                                    </div>
                                  )}
                                </>
                              )}
                              {(recharge.status === 'activated' || recharge.status === 'paid') && (
                                <div className="flex items-end gap-2 col-span-2 sm:col-span-1 justify-end">
                                  <button onClick={() => handleShareReceipt(recharge)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-green-300 hover:bg-green-400/10 transition-colors"
                                    style={{ border: '1px solid rgba(74,222,128,0.3)' }}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                    Share
                                  </button>
                                  <button onClick={() => handleDownloadReceipt(recharge.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-200 hover:bg-white/10 transition-colors"
                                    style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Receipt
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Accessories History Content */}
                {accessoryOrdersList.length === 0 ? (
                  <div className="rounded-2xl text-center py-14 px-6" style={glass}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{ background: 'rgba(255,255,255,0.06)' }}>📦</div>
                    <p className="text-gray-400 mb-5 font-medium">No accessory order history yet</p>
                    <button
                      onClick={() => setActiveTab('accessories')}
                      className="px-6 py-3 rounded-xl font-bold text-white"
                      style={{ background: accentGradient }}
                    >
                      Browse Accessories
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accessoryOrdersList.map((order) => {
                      const pillStatus = order.status === 'delivered' ? 'delivered' : order.status === 'paid' ? 'paid' : order.status === 'failed' ? 'failed' : 'pending';
                      const accent = order.status === 'delivered' ? '#4ade80' : order.status === 'paid' ? '#fbbf24' : order.status === 'failed' ? '#f87171' : '#94a3b8';
                      return (
                        <div key={order.id} className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
                          style={{ ...glass, borderLeft: `3px solid ${accent}` }}>
                          <div className="p-4 sm:p-5">
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(192,132,252,0.12)', border: '1px solid rgba(192,132,252,0.3)' }}>
                                <svg className="w-5 h-5" fill="none" stroke="#c084fc" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-sm sm:text-base mb-0.5 truncate">{order.accessory_name}</h3>
                                <p className="text-[11px] text-gray-500 font-mono truncate">#{order.id}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-lg sm:text-xl font-extrabold text-white mb-1">{formatCurrency(order.amount)}</p>
                                <StatusPill
                                  status={pillStatus}
                                  label={order.status === 'delivered' ? t('delivered') : order.status === 'paid' ? t('pendingDelivery') : order.status}
                                />
                              </div>
                            </div>

                            <div className="mt-4 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                              <div>
                                <p className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Ordered</p>
                                <p className="font-semibold text-gray-200">{formatDateTime(new Date(order.created_at))}</p>
                              </div>
                              {order.paid_at && (
                                <div>
                                  <p className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Paid</p>
                                  <p className="font-semibold text-gray-200">{formatDateTime(new Date(order.paid_at))}</p>
                                </div>
                              )}
                              {order.status === 'delivered' && order.delivered_at && (
                                <div>
                                  <p className="text-gray-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Delivered</p>
                                  <p className="font-bold text-green-400">{formatDateTime(new Date(order.delivered_at))}</p>
                                  {order.delivered_by && <p className="text-[10px] text-gray-500 mt-0.5">by {order.delivered_by}</p>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
        months={selectedPlanMonths}
        discounts={selectedPlan?.discounts}
        stbNumber={customer?.stb_number || ''}
        customerName={customer?.name || ''}
        customerMobile={customer?.mobile || ''}
        dueAmount={customer?.outstanding_balance || 0}
      />

      <AccessoryPaymentModal
        isOpen={showAccessoryModal}
        onClose={() => setShowAccessoryModal(false)}
        accessory={selectedAccessory}
        stbNumber={customer?.stb_number || ''}
        customerName={customer?.name || ''}
        customerMobile={customer?.mobile || ''}
      />

      {/* Retrack Popup */}
      {showRetrackPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
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
                <button onClick={() => setShowRetrackPopup(false)}
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
                  <input type="text" inputMode="numeric"
                    value={retrackEdited ? retrackStb : (customer?.stb_number || '')}
                    onChange={(e) => { setRetrackEdited(true); setRetrackStb(e.target.value.replace(/\D/g, '')); }}
                    onKeyDown={(e) => { if (!retrackEdited && e.key !== 'Tab' && e.key !== 'Enter') { setRetrackEdited(true); setRetrackStb(''); } }}
                    placeholder="Enter your STB number"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-mono text-gray-800 outline-none transition-colors"
                    style={{ borderColor: retrackEdited ? '#3b82f6' : '#e5e7eb' }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRetrackPopup(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleRetrackRequest}
                    disabled={retrackLoading || !(retrackEdited ? retrackStb : customer?.stb_number)}
                    className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #e63946, #c0392b)' }}>
                    {retrackLoading ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlanCard from '@/components/PlanCard';
import PaymentModal from '@/components/PaymentModal';
import AccessoryPaymentModal from '@/components/AccessoryPaymentModal';
import AccessoryCard from '@/components/AccessoryCard';
import StatusBadge from '@/components/StatusBadge';
import { formatCurrency, formatDateTime, formatDateDMY, formatDisplayEndDate } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  channels: string[];
  is_popular: boolean;
  isCustomPrice?: boolean;
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
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
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
  const [activeTab, setActiveTab] = useState<'buy' | 'accessories' | 'history'>('history');
  const [historyType, setHistoryType] = useState<'recharges' | 'accessories'>('recharges');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [accessoriesList, setAccessoriesList] = useState<Accessory[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [accessoryOrdersList, setAccessoryOrdersList] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAccessoryModal, setShowAccessoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNavMenu, setShowNavMenu] = useState(false);

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, customerRes, rechargesRes, accessoriesRes, accOrdersRes] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/recharge/history', { cache: 'no-store' }),
        fetch('/api/accessories', { cache: 'no-store' }),
        fetch('/api/accessory/history', { cache: 'no-store' }),
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

  const handleSelectPlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
      </div>
    );
  }

  if (customer && customer.outstanding_balance > 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{
        backgroundColor: '#0a0a1a',
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)',
        backgroundSize: '44px 44px, 44px 44px',
      }}>
        <nav className="sticky top-0 z-30 shadow-lg" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #1a1a4e 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)' }} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="font-display text-xl font-extrabold text-white tracking-wide">CCN</span>
                <span className="font-display text-xl font-extrabold tracking-wide" style={{ color: '#e94560' }}>Networks</span>
              </Link>
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
                      <Link href="/" onClick={() => setShowNavMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors"><span>🏠</span> Home</Link>
                      <Link href="/dashboard" onClick={() => setShowNavMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors"><span>📊</span> Dashboard</Link>
                      <Link href="/dashboard/buy" onClick={() => setShowNavMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors"><span>💳</span> Buy & History</Link>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="my-1" />
                      <button onClick={() => { setShowNavMenu(false); handleLogout(); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-colors w-full text-left"><span>🚪</span> Logout</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="font-display text-2xl font-bold text-brand-navy mb-2">Recharge Blocked</h2>
            <p className="text-gray-600 mb-6 text-sm">
              You have an outstanding due on your account. Please clear your dues to continue recharging.
            </p>
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 mb-6">
              <p className="text-sm text-red-600 font-medium mb-1">Outstanding Due</p>
              <p className="text-4xl font-black text-red-600">₹{customer.outstanding_balance}</p>
              <p className="text-xs text-red-400 mt-1">Pay this amount to your cable operator to unlock recharge</p>
            </div>
            <p className="text-sm text-gray-500">
              Contact <span className="font-semibold text-brand-navy">CCN Networks</span> to pay your dues and unlock your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      backgroundColor: '#0a0a1a',
      backgroundImage: 'linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)',
      backgroundSize: '44px 44px, 44px 44px',
    }}>
      {/* Header */}
      <nav className="sticky top-0 z-30 shadow-lg" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #1a1a4e 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-display text-xl font-extrabold text-white tracking-wide">CCN</span>
              <span className="font-display text-xl font-extrabold tracking-wide" style={{ color: '#e94560' }}>Networks</span>
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
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-brand-navy mb-2">
            Buy Plans & History
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Purchase new plans or view your complete recharge history
          </p>
        </div>

        {/* Next Expiry Alert */}
        {nextExpiringPlan && (
          <div className="card bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-orange-900 mb-1">Next Plan Expiring Soon</h3>
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">{nextExpiringPlan.plan_name}</span> expires{' '}
                  <span className="font-semibold">
                    {formatFriendlyDate(new Date(nextExpiringPlan.expires_at!))}
                  </span>
                  {' '}•{' '}
                  <span className={`font-bold ${getTimeRemaining(new Date(nextExpiringPlan.expires_at!)).color}`}>
                    {getTimeRemaining(new Date(nextExpiringPlan.expires_at!)).text}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActiveTab('buy')}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Renew Now
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-accent-blue">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="text-lg sm:text-2xl font-bold text-accent-blue">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-success">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Active Plans</p>
            <p className="text-lg sm:text-2xl font-bold text-success">{activeRecharges}</p>
          </div>
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-600">{pendingRecharges}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-lg sm:text-2xl font-bold text-purple-600">{totalRecharges}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6 sm:mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'buy'
                  ? 'text-accent-red border-b-2 border-accent-red'
                  : 'text-gray-600 hover:text-brand-navy'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Buy Plans
              </span>
            </button>
            <button
              onClick={() => setActiveTab('accessories')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'accessories'
                  ? 'text-accent-red border-b-2 border-accent-red'
                  : 'text-gray-600 hover:text-brand-navy'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {t('buyAccessories')}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'history'
                  ? 'text-accent-red border-b-2 border-accent-red'
                  : 'text-gray-600 hover:text-brand-navy'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </span>
            </button>
          </div>
        </div>

        {/* Buy Tab Content */}
        {activeTab === 'buy' && (
          <div>
            <div className="mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-4">
                Available Plans
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Choose a plan and make instant payment
              </p>
            </div>

            {plans.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600">No plans available at the moment.</p>
              </div>
            ) : (
              <>
                {/* Test Plan */}
                {plans.filter(p => p.price === 100).length > 0 && (
                  <div className="max-w-md mx-auto mb-8">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-700 font-bold text-sm sm:text-base">Test Payment Gateway</span>
                      </div>
                      {plans.filter(p => p.price === 100).map((plan) => (
                        <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                      ))}
                      <p className="text-center text-xs sm:text-sm text-gray-600 mt-3">
                        Try our payment system with just ₹1 • Perfect for testing
                      </p>
                    </div>
                  </div>
                )}

                {/* Regular Plans */}
                <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-12 md:gap-6 max-w-6xl mx-auto py-12 px-4">
                  {plans.filter(p => p.price !== 100).map((plan, index) => (
                    <PlanCard key={plan.id} plan={plan} index={index} onSelect={handleSelectPlan} />
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
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-brand-navy mb-4 tracking-tight">
                CCN Accessories & Hardware
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Order accessories and have them delivered to your address
              </p>
            </div>

            {accessoriesList.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600">No accessories available at the moment.</p>
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-navy">
                Purchase History
              </h2>
              
              {/* History Sub-selector */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setHistoryType('recharges')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    historyType === 'recharges'
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-gray-500 hover:text-brand-navy'
                  }`}
                >
                  Recharges
                </button>
                <button
                  onClick={() => setHistoryType('accessories')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    historyType === 'accessories'
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-gray-500 hover:text-brand-navy'
                  }`}
                >
                  {t('accessories')}
                </button>
              </div>
            </div>

            {historyType === 'recharges' ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <span className="text-sm text-gray-500">View plan purchase and activation history</span>
                  
                  {/* Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-accent-red text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('activated')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'activated'
                      ? 'bg-success text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Activated
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'paid'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'pending'
                      ? 'bg-gray-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>

            {filteredRecharges.length === 0 ? (
              <div className="card text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">
                  {filterStatus === 'all' ? 'No recharge history yet' : `No ${filterStatus} recharges found`}
                </p>
                {filterStatus === 'all' && (
                  <button
                    onClick={() => setActiveTab('buy')}
                    className="btn-primary inline-block"
                  >
                    Buy Your First Plan
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecharges.map((recharge) => {
                  const isExpired = recharge.expires_at && new Date(recharge.expires_at) < currentTime;
                  const timeRemaining = recharge.expires_at ? getTimeRemaining(new Date(recharge.expires_at)) : null;
                  
                  return (
                    <div 
                      key={recharge.id} 
                      className={`card hover:shadow-lg transition-shadow ${
                        isExpired ? 'bg-gray-50 opacity-75' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Top Section: Plan Info & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          {/* Left: Plan Info */}
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isExpired 
                                  ? 'bg-gray-200' 
                                  : 'bg-accent-blue bg-opacity-10'
                              }`}>
                                <svg className={`w-6 h-6 ${isExpired ? 'text-gray-400' : 'text-accent-blue'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-brand-navy text-base sm:text-lg">
                                    {recharge.plan_name}
                                  </h3>
                                  {isExpired && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                      EXPIRED
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                  Order ID: <span className="font-mono">{recharge.id.slice(0, 20)}...</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount & Status */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 sm:text-right">
                            <p className="text-xl sm:text-2xl font-bold text-brand-navy">
                              {formatCurrency(recharge.amount)}
                            </p>
                            <StatusBadge status={recharge.status} />
                          </div>
                        </div>

                        {/* Bottom Section: Dates & Expiry */}
                        <div className={`pt-4 border-t ${isExpired ? 'border-gray-200' : 'border-gray-100'}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-sm">
                            {recharge.status === 'activated' ? (
                              <>
                                <div>
                                  <p className="text-gray-500 mb-1">Start Date</p>
                                  <p className="font-medium text-gray-700">
                                    {formatDateDMY(recharge.activated_at)}
                                  </p>
                                </div>
                                {recharge.expires_at && (
                                  <div>
                                    <p className="text-gray-500 mb-1">
                                      {isExpired ? 'Expired On' : 'End Date'}
                                    </p>
                                    <p className={`font-bold ${timeRemaining?.color || 'text-gray-700'}`}>
                                      {formatDisplayEndDate(recharge.expires_at)}
                                    </p>
                                    {timeRemaining && !isExpired && (
                                      <p className={`text-xs font-semibold mt-1 ${timeRemaining.color}`}>
                                        {timeRemaining.text}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <p className="text-gray-500 mb-1">Effective Date</p>
                                  <p className="font-medium text-gray-700">
                                    {formatDateDMY(recharge.activated_at)}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-gray-500 mb-1">Created</p>
                                  <p className="font-medium text-gray-700">
                                    {formatDateTime(new Date(recharge.created_at))}
                                  </p>
                                </div>
                                {recharge.paid_at && (
                                  <div>
                                    <p className="text-gray-500 mb-1">Paid</p>
                                    <p className="font-medium text-gray-700">
                                      {formatDateTime(new Date(recharge.paid_at))}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
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
                  <div className="card text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">No accessory order history yet</p>
                    <button
                      onClick={() => setActiveTab('accessories')}
                      className="btn-primary inline-block"
                    >
                      Browse Accessories
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accessoryOrdersList.map((order) => {
                      return (
                        <div key={order.id} className="card hover:shadow-lg transition-shadow">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-lg bg-accent-blue bg-opacity-10 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-brand-navy text-base sm:text-lg">
                                      {order.accessory_name}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600">
                                      Order ID: <span className="font-mono">{order.id}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 sm:text-right">
                                <p className="text-xl sm:text-2xl font-bold text-brand-navy">
                                  {formatCurrency(order.amount)}
                                </p>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  order.status === 'delivered'
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : order.status === 'paid'
                                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                    : order.status === 'failed'
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {order.status === 'delivered' ? t('delivered') : order.status === 'paid' ? t('pendingDelivery') : order.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm">
                                <div>
                                  <p className="text-gray-500 mb-1">Ordered On</p>
                                  <p className="font-medium text-gray-700">
                                    {formatDateTime(new Date(order.created_at))}
                                  </p>
                                </div>
                                {order.paid_at && (
                                  <div>
                                    <p className="text-gray-500 mb-1">Paid On</p>
                                    <p className="font-medium text-gray-700">
                                      {formatDateTime(new Date(order.paid_at))}
                                    </p>
                                  </div>
                                )}
                                {order.status === 'delivered' && order.delivered_at && (
                                  <div>
                                    <p className="text-gray-500 mb-1">Delivered On</p>
                                    <p className="font-bold text-green-600">
                                      {formatDateTime(new Date(order.delivered_at))}
                                    </p>
                                    {order.delivered_by && (
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        Operator: {order.delivered_by}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
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
        stbNumber={customer?.stb_number || ''}
        customerName={customer?.name || ''}
        customerMobile={customer?.mobile || ''}
      />

      <AccessoryPaymentModal
        isOpen={showAccessoryModal}
        onClose={() => setShowAccessoryModal(false)}
        accessory={selectedAccessory}
        stbNumber={customer?.stb_number || ''}
        customerName={customer?.name || ''}
        customerMobile={customer?.mobile || ''}
      />
    </div>
  );
}

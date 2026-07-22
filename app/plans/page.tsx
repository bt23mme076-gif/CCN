'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PlanCard from '@/components/PlanCard';
import PaymentModal from '@/components/PaymentModal';
import Navbar from '@/components/Navbar';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  channels: string[];
  is_popular: boolean;
  isCustomPrice?: boolean;
}

interface Customer {
  id: string;
  name: string;
  mobile: string;
  stb_number: string;
  outstanding_balance: number;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const onConnectionChanged = () => fetchData();
    window.addEventListener('ccn-connection-changed', onConnectionChanged);
    return () => window.removeEventListener('ccn-connection-changed', onConnectionChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    const cid = typeof window !== 'undefined' ? localStorage.getItem('ccn_active_cid') : null;
    const cidParam = cid ? `?cid=${cid}` : '';
    try {
      const [plansRes, customerRes] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store' }),
        fetch(`/api/auth/me${cidParam}`, { cache: 'no-store' }),
      ]);

      if (!customerRes.ok) {
        router.push('/login');
        return;
      }

      const plansData = await plansRes.json();
      const customerData = await customerRes.json();

      setPlans(plansData.plans || []);
      setCustomer(customerData.customer);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPlans([]);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red" />
      </div>
    );
  }

  if (customer && customer.outstanding_balance > 0) {
    return (
      <div className="min-h-screen flex flex-col relative"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Recharge Blocked</h2>
            <p className="text-gray-300 mb-6 text-sm">
              You have an outstanding due on your account. Please clear your dues to continue recharging.
            </p>
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 mb-6">
              <p className="text-sm text-red-300 font-medium mb-1">Outstanding Due</p>
              <p className="text-4xl font-black text-red-400">₹{customer.outstanding_balance}</p>
              <p className="text-xs text-red-300/70 mt-1">Pay this amount to your cable operator to unlock recharge</p>
            </div>
            <p className="text-sm text-gray-400">
              Contact <span className="font-semibold text-white">CCN Networks</span> to pay your dues and unlock your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayPlans = plans.filter(p => p.price !== 100);
  const testPlans = plans.filter(p => p.price === 100);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

      {/* Animated orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-96 h-96 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', top: '10%', left: '5%', filter: 'blur(60px)' }} />
        <div className="absolute w-80 h-80 rounded-full opacity-15 animate-float-delay"
          style={{ background: 'radial-gradient(circle, #e63946, transparent)', top: '20%', right: '8%', filter: 'blur(50px)' }} />
        <div className="absolute w-72 h-72 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #48cae4, transparent)', bottom: '15%', left: '15%', filter: 'blur(55px)', animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">

          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-white/10 backdrop-blur-sm text-xs font-medium px-4 py-1.5 rounded-full mb-4 border border-white/10 text-blue-200">
              CCN Special Plans
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4">
              Choose Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-red via-accent-orange to-accent-red">
                Perfect Plan
              </span>
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto">
              Select the plan that fits your entertainment needs
            </p>
          </div>

          {plans && plans.length > 0 ? (
            <>
              {/* Test Plan */}
              {testPlans.length > 0 && (
                <div className="max-w-md mx-auto w-full mb-10">
                  <div className="rounded-2xl p-5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="text-green-400 text-sm font-bold">✓ Test Payment Gateway</span>
                    </div>
                    {testPlans.map((plan) => (
                      <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                    ))}
                    <p className="text-center text-xs text-gray-400 mt-3">
                      Try our payment system with just ₹1 • Perfect for testing
                    </p>
                  </div>
                </div>
              )}

              {/* Regular Plans */}
              <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-8 md:gap-6 w-full">
                {displayPlans.map((plan, index) => (
                  <PlanCard key={plan.id} plan={plan} index={index} onSelect={handleSelectPlan} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No plans available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
        stbNumber={customer?.stb_number || ''}
        customerName={customer?.name || ''}
        customerMobile={customer?.mobile || ''}
        connectionId={typeof window !== 'undefined' ? (localStorage.getItem('ccn_active_cid') || 'primary') : 'primary'}
      />
    </div>
  );
}

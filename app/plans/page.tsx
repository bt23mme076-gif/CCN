'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PlanCard from '@/components/PlanCard';
import PaymentModal from '@/components/PaymentModal';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  channels: string[];
  is_popular: boolean;
}

interface Customer {
  name: string;
  mobile: string;
  stb_number: string;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, customerRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/auth/me'),
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-1">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-display text-2xl font-bold text-brand-navy">
              CCN Cable
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-brand-navy font-medium"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-accent-red hover:underline font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-brand-navy mb-4">
            Our CCN Special Plans
          </h1>
          <p className="text-gray-600 text-lg">
            Select the perfect plan for your entertainment needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
          {plans && plans.length > 0 ? (
            <>
              {/* Test Plan - If Available */}
              {plans.filter(p => p.price === 100).length > 0 && (
                <div className="md:col-span-2 max-w-md mx-auto w-full">
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
              {plans.filter(p => p.price !== 100).map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
              ))}
            </>
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">No plans available at the moment.</p>
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
      />
    </div>
  );
}

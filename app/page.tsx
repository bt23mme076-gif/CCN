'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlanCard from '@/components/PlanCard';
import PaymentModal from '@/components/PaymentModal';
import WhatsAppButton from '@/components/WhatsAppButton';
import ContactSection from '@/components/ContactSection';

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

export default function HomePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomer(customerData.customer);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!customer) {
      router.push('/login');
      return;
    }
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-brand-navy text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Welcome to CCN Cable Network
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Fast, secure, and hassle-free cable recharge with instant activation.
            Choose our best-selling ₹199 or ₹299 plans and get started in minutes.
          </p>
          {!customer && (
            <button
              onClick={() => router.push('/register')}
              className="bg-accent-red text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
            >
              Sign-Up
            </button>
          )}
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-12 sm:py-16 bg-gray-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-brand-navy mb-3 sm:mb-4">
              Our CCN Special Plans
            </h2>
            <p className="text-gray-600 text-base sm:text-lg px-4">
              Select the perfect plan for your entertainment needs
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
            </div>
          ) : plans && plans.length > 0 ? (
            <>
              {/* Test Plan - Prominent Display */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6 sm:gap-8">
                {plans.filter(p => p.price === 19900 || p.price === 29900 || p.price === 34900).map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No plans available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent-red bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-accent-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">
                Instant Activation
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Your recharge is activated within minutes by our operators
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-accent-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">
                Secure Payments
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                All transactions are secured with Cashfree payment gateway
              </p>
            </div>

            <div className="text-center p-4 sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-success bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">
                Full History
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Track all your recharges and view detailed transaction history
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      <Footer />

      {/* Floating WhatsApp Button */}
      <WhatsAppButton />

      {customer && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={selectedPlan}
          stbNumber={customer.stb_number}
          customerName={customer.name}
          customerMobile={customer.mobile}
        />
      )}
    </div>
  );
}

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

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, customerRes] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
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

  const displayPlans = plans.filter(p => p.price !== 100);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-16 sm:py-20 md:py-28 overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent-orange rounded-full opacity-[0.07] blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-electric rounded-full opacity-[0.08] blur-3xl animate-float-delay" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent-cyan rounded-full opacity-[0.05] blur-3xl animate-float" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent-red/5 via-brand-electric/5 to-accent-cyan/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fadeInUp">
            <span className="inline-block bg-white/10 backdrop-blur-sm text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/10">
              Trusted by 2,000+ households
            </span>
          </div>

          <h1 className="animate-fadeInUp-delay-1 font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-6 leading-tight">
            Your Entertainment,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-red via-accent-orange to-accent-red bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
              Simplified
            </span>
          </h1>

          <p className="animate-fadeInUp-delay-2 text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto px-2 leading-relaxed">
            Recharge your cable TV online in seconds. Instant activation, secure payments,
            and plans starting at just ₹199/month.
          </p>

          <div className="animate-fadeInUp-delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!customer ? (
              <>
                <button
                  onClick={() => router.push('/register')}
                  className="btn-gradient px-8 py-3.5 rounded-xl font-semibold text-base sm:text-lg w-full sm:w-auto"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-300 border border-white/20 w-full sm:w-auto"
                >
                  Login to Recharge
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  const el = document.getElementById('plans');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-gradient px-8 py-3.5 rounded-xl font-semibold text-base sm:text-lg w-full sm:w-auto"
              >
                Browse Plans
              </button>
            )}
          </div>

          {/* Trust indicators */}
          <div className="animate-fadeInUp-delay-3 mt-10 sm:mt-14 flex flex-wrap justify-center gap-6 sm:gap-10 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Instant Activation</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-brand-navy mb-3">
              How It Works
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Recharge your cable connection in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 max-w-4xl mx-auto relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-accent-red via-accent-orange to-accent-cyan" />

            {/* Step 1 */}
            <div className="text-center relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-4 ring-red-100 shadow-sm">
                <span className="font-display text-2xl sm:text-3xl font-bold text-accent-red">1</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">Create Account</h3>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                Sign up with your STB number and mobile in under a minute
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-4 ring-blue-100 shadow-sm">
                <span className="font-display text-2xl sm:text-3xl font-bold text-accent-blue">2</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">Choose a Plan</h3>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                Pick from our affordable plans starting at just ₹199/month
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-4 ring-green-100 shadow-sm">
                <span className="font-display text-2xl sm:text-3xl font-bold text-success">3</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">Pay & Watch</h3>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-[260px] mx-auto">
                Pay securely online and your connection is activated instantly
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-14 sm:py-20 bg-gray-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block bg-gradient-accent text-white text-sm font-semibold px-5 py-1.5 rounded-full mb-4 shadow-sm">
              Our Plans
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-brand-navy mb-3 sm:mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-gray-500 text-base sm:text-lg px-4 max-w-xl mx-auto">
              All plans include instant activation and 24/7 customer support
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
            </div>
          ) : displayPlans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6 sm:gap-8">
              {displayPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No plans available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="py-10 sm:py-14 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(83,52,131,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(72,202,228,0.08),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-gradient-brand">2,000+</div>
              <div className="text-xs sm:text-sm text-gray-400">Happy Customers</div>
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-gradient-blue">200+</div>
              <div className="text-xs sm:text-sm text-gray-400">SD & HD Channels</div>
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-gradient-brand">15 min</div>
              <div className="text-xs sm:text-sm text-gray-400">Avg Activation Time</div>
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 text-gradient-blue">24/7</div>
              <div className="text-xs sm:text-sm text-gray-400">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-brand-navy mb-3">
              Why Choose CCN Networks?
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              We make cable TV recharge simple, fast, and reliable
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Instant Activation */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-accent-red" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">Instant Activation</h3>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                Your recharge is activated within minutes by our operators — no waiting around
              </p>
            </div>

            {/* Secure Payments */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-accent-blue" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">Secure Payments</h3>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                All transactions are secured with Cashfree payment gateway — UPI, cards & more
              </p>
            </div>

            {/* Full History */}
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-2">Full History</h3>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                Track all your recharges, view expiry dates, and manage your connection online
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

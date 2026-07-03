'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlanCard from '@/components/PlanCard';
import PaymentModal from '@/components/PaymentModal';
import AccessoryPaymentModal from '@/components/AccessoryPaymentModal';
import AccessoryCard from '@/components/AccessoryCard';
import WhatsAppButton from '@/components/WhatsAppButton';
import ContactSection from '@/components/ContactSection';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

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

interface Accessory {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [accessoriesList, setAccessoriesList] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [showAccessoryModal, setShowAccessoryModal] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, customerRes, accessoriesRes] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/accessories', { cache: 'no-store' }),
      ]);

      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomer(customerData.customer);
      }

      if (accessoriesRes.ok) {
        const accData = await accessoriesRes.json();
        setAccessoriesList(accData.accessories || []);
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

  const handleSelectAccessory = async (accId: string) => {
    if (!customer) {
      router.push('/login');
      return;
    }
    const accessory = accessoriesList.find((a) => a.id === accId);
    if (accessory) {
      setSelectedAccessory(accessory);
      setShowAccessoryModal(true);
    }
  };

  const displayPlans = plans.filter(p => p.price !== 100);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Floating animated orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-96 h-96 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', top: '10%', left: '5%', filter: 'blur(60px)' }} />
        <div className="absolute w-80 h-80 rounded-full opacity-15 animate-float-delay"
          style={{ background: 'radial-gradient(circle, #e63946, transparent)', top: '20%', right: '8%', filter: 'blur(50px)' }} />
        <div className="absolute w-72 h-72 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #48cae4, transparent)', bottom: '15%', left: '15%', filter: 'blur(55px)', animationDelay: '2s' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-10 animate-float-delay"
          style={{ background: 'radial-gradient(circle, #533483, transparent)', bottom: '25%', right: '10%', filter: 'blur(45px)' }} />
      </div>

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

          <h1 className="animate-fadeInUp-delay-1 font-display text-3xl sm:text-5xl md:text-6xl font-bold mb-5 sm:mb-6 leading-tight tracking-tight">
            Your TV. Your Plans.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-red via-accent-orange to-accent-red bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
              Recharged in Seconds.
            </span>
          </h1>

          <p className="animate-fadeInUp-delay-2 text-base sm:text-lg text-gray-300 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed font-normal">
            Recharge your cable TV from your phone — anytime, anywhere with instant activation
            and 100% secure payments.
          </p>

          <div className="animate-fadeInUp-delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!customer ? (
              <>
                <button
                  onClick={() => router.push('/register')}
                  className="btn-gradient px-8 py-3.5 rounded-xl font-semibold text-base sm:text-lg w-full sm:w-auto"
                >
                  Get Started
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

      {/* Plans Section */}
      <section id="plans" className="pt-14 pb-0 sm:pt-20 sm:pb-0 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block bg-gradient-accent text-white text-xs font-semibold px-5 py-1.5 rounded-full mb-4 shadow-sm tracking-wide uppercase">
              Our Plans
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-brand-navy mb-3 sm:mb-4">
              Choose Your Perfect Plan
            </h2>
            <p className="text-gray-500 text-base px-4 max-w-xl mx-auto">
              All plans include instant activation and 24/7 customer support
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
            </div>
          ) : displayPlans.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center md:items-stretch justify-center gap-12 md:gap-6 max-w-6xl mx-auto py-12 px-4">
              {displayPlans.map((plan, index) => (
                <PlanCard key={plan.id} plan={plan} index={index} onSelect={handleSelectPlan} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No plans available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Accessories Section */}
      <section id="accessories" className="pt-14 pb-16 sm:pt-20 sm:pb-24 relative overflow-hidden">
        {/* Colorful decorative background */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/80 via-fuchsia-50/50 to-orange-50/60" />
        <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-purple-400/20 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-cyan-400/20 blur-3xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-orange-300/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block bg-gradient-to-r from-purple-500 via-fuchsia-500 to-orange-500 text-white text-xs font-bold px-5 py-1.5 rounded-full mb-4 shadow-md tracking-wide uppercase animate-fadeInUp">
              {t('accessories')}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-brand-navy mb-3 sm:mb-4 tracking-tight animate-fadeInUp-delay-1">
              Need a Remote or{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-500">
                Spare Parts?
              </span>
            </h2>
            <p className="text-gray-500 text-base px-4 max-w-xl mx-auto animate-fadeInUp-delay-2">
              Get genuine CCN accessories delivered right to your doorstep by our operator
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
            </div>
          ) : accessoriesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto gap-6 sm:gap-8">
              {accessoriesList.map((item) => (
                <AccessoryCard key={item.id} item={item} onSelect={handleSelectAccessory} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No accessories available at the moment.</p>
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
      <section className="py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-brand-navy mb-3">
              Why Choose CCN Networks?
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">
              We make cable TV recharge simple, fast, and reliable
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">

            {/* Instant Activation */}
            <div className="group relative rounded-2xl p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-default"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', border: '1px solid rgba(99,102,241,0.3)' }}>
              {/* Glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(230,57,70,0.15), transparent 70%)' }} />
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, #e63946, #f77f00)' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.2), rgba(247,127,0,0.2))', border: '1px solid rgba(230,57,70,0.3)' }}>
                  <svg className="w-7 h-7" fill="none" stroke="url(#grad1)" strokeWidth={2} viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e63946" />
                        <stop offset="100%" stopColor="#f77f00" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">Instant Activation</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Your recharge is activated within minutes — no waiting around, no delays.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#f77f00' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  Live activation status
                </div>
              </div>
            </div>

            {/* Secure Payments */}
            <div className="group relative rounded-2xl p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-default"
              style={{ background: 'linear-gradient(135deg, #0f1f3d 0%, #1a2f5e 60%, #0f3460 100%)', border: '1px solid rgba(72,202,228,0.3)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(72,202,228,0.15), transparent 70%)' }} />
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, #457b9d, #48cae4)' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(69,123,157,0.2), rgba(72,202,228,0.2))', border: '1px solid rgba(72,202,228,0.3)' }}>
                  <svg className="w-7 h-7" fill="none" stroke="url(#grad2)" strokeWidth={2} viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#457b9d" />
                        <stop offset="100%" stopColor="#48cae4" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">Secure Payments</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  All transactions secured with Cashfree — UPI, cards, net banking & more.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#48cae4' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  256-bit SSL encrypted
                </div>
              </div>
            </div>

            {/* Full History */}
            <div className="group relative rounded-2xl p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-default"
              style={{ background: 'linear-gradient(135deg, #0d2818 0%, #1a3a2a 60%, #1e4d35 100%)', border: '1px solid rgba(45,106,79,0.4)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(45,106,79,0.2), transparent 70%)' }} />
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, #2d6a4f, #52b788)' }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(45,106,79,0.25), rgba(82,183,136,0.2))', border: '1px solid rgba(82,183,136,0.3)' }}>
                  <svg className="w-7 h-7" fill="none" stroke="url(#grad3)" strokeWidth={2} viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2d6a4f" />
                        <stop offset="100%" stopColor="#52b788" />
                      </linearGradient>
                    </defs>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">Full History</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Track all your recharges, view expiry dates, and manage your connection online.
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#52b788' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Real-time updates
                </div>
              </div>
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

      {customer && (
        <AccessoryPaymentModal
          isOpen={showAccessoryModal}
          onClose={() => setShowAccessoryModal(false)}
          accessory={selectedAccessory}
          stbNumber={customer.stb_number}
          customerName={customer.name}
          customerMobile={customer.mobile}
        />
      )}
    </div>
  );
}

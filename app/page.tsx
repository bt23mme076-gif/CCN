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
import AlacartePaymentModal from '@/components/AlacartePaymentModal';
import SponsorSlideshow from '@/components/SponsorSlideshow';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';
import { getChannelLogo, getChannelColor } from '@/lib/channelLogos';


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
  fast_recharge_enabled: boolean;
  fast_recharge_amount: number;
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
  const [fastRechargeLoading, setFastRechargeLoading] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiModalLinks, setUpiModalLinks] = useState<{ upiLink: string; intentLink: string; amount: number } | null>(null);

  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [showAccessoryModal, setShowAccessoryModal] = useState(false);

  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [showAlacarteModal, setShowAlacarteModal] = useState(false);
  const [rechargesList, setRechargesList] = useState<any[]>([]);
  const [showPrerequisiteModal, setShowPrerequisiteModal] = useState(false);
  const [channelPage, setChannelPage] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [sliding, setSliding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [adsList, setAdsList] = useState<{ id: string; business_name: string; image_data: string; phone: string | null }[]>([]);



  useEffect(() => {
    fetchData();
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, customerRes, accessoriesRes, channelsRes, adsRes] = await Promise.all([
        fetch('/api/plans', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/accessories', { cache: 'no-store' }),
        fetch('/api/channels'),
        fetch('/api/advertisements', { cache: 'no-store' }),
      ]);

      const plansData = await plansRes.json();
      setPlans(plansData.plans || []);

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        setCustomer(customerData.customer);

        // Fetch recharge history to check for active base plan prerequisite
        const rechargesRes = await fetch('/api/recharge/history', { cache: 'no-store' });
        if (rechargesRes.ok) {
          const rechargesData = await rechargesRes.ok ? await rechargesRes.json() : { recharges: [] };
          setRechargesList(rechargesData.recharges || []);
        }
      }

      if (accessoriesRes.ok) {
        const accData = await accessoriesRes.json();
        setAccessoriesList(accData.accessories || []);
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannels(channelsData.channels || []);
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAdsList(adsData.advertisements || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleFastRecharge = () => {
    if (!customer) { router.push('/login'); return; }
    const amountInRupees = (customer.fast_recharge_amount / 100).toFixed(2);
    const upiParams = `pa=itsjatinrai%40ybl&pn=CCN+Networks&am=${amountInRupees}&cu=INR&tn=CCN+Fast+Recharge`;
    const upiLink = `upi://pay?${upiParams}`;
    fetch('/api/recharge/create-upi-order', { method: 'POST' }).catch(() => {});
    window.location.href = upiLink;
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

  const handleToggleChannel = (channelId: number) => {
    setSelectedChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleBuyAlacarte = () => {
    if (!customer) {
      router.push('/login');
      return;
    }
    const hasActiveBaseBundle = rechargesList.some((r) => {
      const isExpired = r.expires_at ? new Date(r.expires_at) <= new Date() : true;
      const isAlacarte = r.plan_name.toUpperCase().startsWith('ALA CARTE');
      return r.status === 'activated' && !isExpired && !isAlacarte;
    });
    if (!hasActiveBaseBundle) {
      setShowPrerequisiteModal(true);
      return;
    }
    setShowAlacarteModal(true);
  };


  const displayPlans = plans.filter(p => p.price !== 100);

  const filteredChannels = channels.filter((channel) => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          channel.epg.toString().includes(searchQuery);
    const matchesGenre = selectedGenre === 'All' || channel.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const CHANNELS_PER_PAGE = isMobile ? 6 : 12;
  const totalChannelPages = Math.ceil(filteredChannels.length / CHANNELS_PER_PAGE);
  const pagedChannels = filteredChannels.slice(channelPage * CHANNELS_PER_PAGE, (channelPage + 1) * CHANNELS_PER_PAGE);

  const goToChannelPage = (next: number, dir: 'left' | 'right') => {
    if (sliding || next < 0 || next >= totalChannelPages) return;
    setSlideDir(dir);
    setSliding(true);
    setTimeout(() => {
      setChannelPage(next);
      setSliding(false);
    }, 300);
  };

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
            ) : customer.fast_recharge_enabled ? (
              <button
                onClick={handleFastRecharge}
                className="btn-gradient px-8 py-3.5 rounded-xl font-semibold text-base sm:text-lg w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {`Fast Recharge — ₹${customer.fast_recharge_amount / 100}`}
              </button>
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

      {/* A La Carte Section */}
      <section id="alacarte" className="pt-14 pb-16 sm:pt-20 sm:pb-24 relative overflow-hidden">
        {/* Animated background shape */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#faf5ff]/40 to-[#f3e8ff]/30" />
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full bg-pink-300/10 blur-3xl animate-float" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-5 py-1.5 rounded-full mb-4 shadow-md tracking-wide uppercase">
              {t('alaCarte')}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-brand-navy mb-3 sm:mb-4 tracking-tight">
              {t('alaCarte')}
            </h2>
            <p className="text-gray-500 text-base px-4 max-w-xl mx-auto">
              {t('alaCarteSubtitle')}
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-100 max-w-6xl mx-auto">
            {/* Prerequisite base package check */}
            {(() => {
              const hasActiveBaseBundle = rechargesList.some((r) => {
                const isExpired = r.expires_at ? new Date(r.expires_at) <= new Date() : true;
                const isAlacarte = r.plan_name.toUpperCase().startsWith('ALA CARTE');
                return r.status === 'activated' && !isExpired && !isAlacarte;
              });

              const totalOriginalPaise = selectedChannels.reduce(
                (sum, id) => sum + (channels.find((c) => c.id === id)?.price || 0),
                0
              );
              const totalOriginalRupees = totalOriginalPaise / 100;
              const totalRoundedRupees = Math.ceil(totalOriginalRupees);
              const totalRoundedPaise = totalRoundedRupees * 100;

              return (
                <>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
              {/* Search Bar */}
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder={t('searchChannel')}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setChannelPage(0); }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-100 bg-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-gray-800 shadow-inner"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Genre Tabs */}
              <div className="w-full md:max-w-xl overflow-x-auto flex gap-2 pb-2 scrollbar-thin">
                <button
                  onClick={() => { setSelectedGenre('All'); setChannelPage(0); }}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedGenre === 'All'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white/80 border border-purple-100 text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  {t('allGenres')}
                </button>
                {Array.from(new Set(channels.map((c) => c.genre))).sort().map((genre) => (
                  <button
                    key={genre}
                    onClick={() => { setSelectedGenre(genre); setChannelPage(0); }}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      selectedGenre === genre
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white/80 border border-purple-100 text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Channels Grid — paginated slider */}
            <div className="relative">
              {/* Slide content */}
              <div
                style={{
                  transition: sliding ? 'transform 0.28s cubic-bezier(.4,0,.2,1), opacity 0.28s ease' : 'none',
                  transform: sliding ? `translateX(${slideDir === 'right' ? '-32px' : '32px'})` : 'translateX(0)',
                  opacity: sliding ? 0 : 1,
                }}
              >
                {pagedChannels.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                    {pagedChannels.map((channel) => {
                      const isSelected = selectedChannels.includes(channel.id);
                      const logoUrl = getChannelLogo(channel.name);
                      const initials = channel.name
                        .replace(/^&/, 'and ')
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w: string) => w[0].toUpperCase())
                        .join('');
                      return (
                        <div
                          key={channel.id}
                          onClick={() => handleToggleChannel(channel.id)}
                          className={`rounded-2xl border cursor-pointer select-none transition-all duration-200 active:scale-95 flex flex-col overflow-hidden ${
                            isSelected
                              ? 'border-purple-500 shadow-lg shadow-purple-500/10 ring-2 ring-purple-400/30'
                              : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200'
                          }`}
                        >
                          {/* Logo block */}
                          <div
                            className="relative flex items-center justify-center h-20 sm:h-24 w-full overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
                            }}
                          >
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={channel.name}
                                className="max-h-12 sm:max-h-14 max-w-[75%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                                  if (fb) fb.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {/* Initials fallback */}
                            <div
                              className="absolute inset-0 flex items-center justify-center text-white font-black text-xl sm:text-2xl"
                              style={{
                                background: getChannelColor(channel.name),
                                display: logoUrl ? 'none' : 'flex',
                              }}
                            >
                              {initials}
                            </div>
                            {/* HD/SD badge */}
                            <span className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              channel.hd_sd === 'HD'
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-200/90 text-gray-600'
                            }`}>
                              {channel.hd_sd}
                            </span>
                            {/* Selected tick */}
                            {isSelected && (
                              <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </div>

                          {/* Info block */}
                          <div className="px-2.5 py-2 flex flex-col gap-1 bg-white">
                            <p className="font-bold text-gray-800 text-[11px] sm:text-xs leading-tight line-clamp-1">{channel.name}</p>
                            <p className="text-[9px] sm:text-[10px] text-purple-500 font-semibold line-clamp-1">{channel.genre}</p>
                            <div className="flex justify-between items-center mt-0.5">
                              <span className="text-[9px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                                Ch.{channel.epg}
                              </span>
                              <span className="text-xs font-black text-purple-700">
                                ₹{(channel.price / 100).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-medium">{t('noChannelsFound')}</p>
                  </div>
                )}
              </div>

              {/* Pagination bar */}
              {totalChannelPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-6">
                  {/* Prev */}
                  <button
                    onClick={() => goToChannelPage(channelPage - 1, 'left')}
                    disabled={channelPage === 0 || sliding}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-600 bg-white border border-purple-100 shadow-sm hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg"
                  >
                    ‹
                  </button>

                  {/* Page numbers */}
                  {(() => {
                    const pages: (number | '...')[] = [];
                    if (totalChannelPages <= 7) {
                      for (let i = 0; i < totalChannelPages; i++) pages.push(i);
                    } else {
                      pages.push(0);
                      if (channelPage > 2) pages.push('...');
                      for (let i = Math.max(1, channelPage - 1); i <= Math.min(totalChannelPages - 2, channelPage + 1); i++) pages.push(i);
                      if (channelPage < totalChannelPages - 3) pages.push('...');
                      pages.push(totalChannelPages - 1);
                    }
                    return pages.map((p, idx) =>
                      p === '...' ? (
                        <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => goToChannelPage(p as number, (p as number) > channelPage ? 'right' : 'left')}
                          disabled={sliding}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                            p === channelPage
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                              : 'bg-white text-gray-600 border border-gray-100 shadow-sm hover:bg-purple-50 hover:text-purple-600'
                          }`}
                        >
                          {(p as number) + 1}
                        </button>
                      )
                    );
                  })()}

                  {/* Next */}
                  <button
                    onClick={() => goToChannelPage(channelPage + 1, 'right')}
                    disabled={channelPage >= totalChannelPages - 1 || sliding}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-purple-600 bg-white border border-purple-100 shadow-sm hover:bg-purple-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>

            {/* Selection Banner below channels list */}
            {selectedChannels.length > 0 && (
              <div className="mt-8 pt-6 border-t border-purple-100 flex flex-col md:flex-row justify-between items-center gap-6 animate-fadeInUp">
                <div className="flex flex-col gap-2 w-full md:max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-sm font-black text-gray-700">
                      {selectedChannels.length} {t('selectedChannels')}
                    </span>
                  </div>
                  {/* Selected Channels tag pills list */}
                  <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-1">
                    {selectedChannels.map((id) => {
                      const channel = channels.find((c) => c.id === id);
                      if (!channel) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-xs font-bold text-purple-700 border border-purple-100"
                        >
                          {channel.name} ({channel.hd_sd})
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleChannel(id);
                            }}
                            className="text-purple-400 hover:text-purple-700 focus:outline-none ml-1 text-sm font-black"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto justify-end">
                  <div className="text-center sm:text-right">
                    <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">
                      {t('totalAmountText')}
                    </span>
                    <span className="text-3xl font-black text-purple-700">
                      ₹{totalRoundedRupees.toFixed(2)}
                    </span>
                    {totalOriginalRupees !== totalRoundedRupees && (
                      <span className="text-[10px] text-gray-400 block font-semibold">
                        Adjusted from ₹{totalOriginalRupees.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleBuyAlacarte}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold text-lg shadow-lg hover:shadow-purple-500/25 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {t('buySelected')}
                  </button>
                </div>
              </div>
            )}
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Local Sponsors Section */}
      <section id="sponsors" className="pt-14 pb-10 sm:pt-20 sm:pb-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-amber-50/40 to-white" />
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full bg-yellow-300/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-orange-300/15 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-5 py-1.5 rounded-full mb-4 shadow-md tracking-wide uppercase">
              Local Sponsors
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-800 font-display">
              Our Community Partners
            </h2>
            <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Supporting local businesses that support our community.
            </p>
          </div>

          {/* Reach stats banner */}
          <div className="mb-8 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0"
            style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid rgba(247,127,0,0.25)' }}>
            <div className="flex flex-wrap justify-center sm:justify-start gap-6 sm:gap-10 text-center sm:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-black text-orange-400">2,000+</p>
                <p className="text-xs text-gray-400">Households Reached</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-yellow-400">Chaurai</p>
                <p className="text-xs text-gray-400">Local Area Coverage</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-green-400">Daily</p>
                <p className="text-xs text-gray-400">Active Website Visitors</p>
              </div>
            </div>
            <a
              href="https://wa.me/919399974696?text=Hello%2C%20I%20want%20to%20advertise%20on%20CCN%20Networks%20website"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f77f00, #d62828)' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Advertise Here
            </a>
          </div>

          {(() => {
            // Group ads by business_name so multiple entries = slideshow slides
            const grouped = adsList.reduce<Record<string, { images: string[]; phone: string | null }>>((acc, ad) => {
              if (!acc[ad.business_name]) {
                acc[ad.business_name] = { images: [], phone: ad.phone };
              }
              acc[ad.business_name].images.push(ad.image_data);
              return acc;
            }, {});

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Object.entries(grouped).map(([name, { images, phone }]) => (
                  <SponsorSlideshow key={name} businessName={name} images={images} phone={phone} />
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* Accessories Section */}

      <section id="accessories" className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-block text-xs font-bold px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest bg-brand-navy/10 text-brand-navy">
              Accessories
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-navy mb-3">
              Need a Remote or Spare Parts?
            </h2>
            <p className="text-gray-500 text-base max-w-md mx-auto">
              Genuine CCN accessories delivered to your doorstep by our operator
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

      {customer && (
        <AlacartePaymentModal
          isOpen={showAlacarteModal}
          onClose={() => setShowAlacarteModal(false)}
          selectedChannelIds={selectedChannels}
          channelCount={selectedChannels.length}
          totalPrice={(() => {
            const totalOriginalPaise = selectedChannels.reduce(
              (sum, id) => sum + (channels.find((c) => c.id === id)?.price || 0),
              0
            );
            const totalOriginalRupees = totalOriginalPaise / 100;
            const totalRoundedRupees = Math.ceil(totalOriginalRupees);
            return totalRoundedRupees * 100;
          })()}
          stbNumber={customer.stb_number}
          customerName={customer.name}
          customerMobile={customer.mobile}
          onSuccess={() => setSelectedChannels([])}
        />
      )}

      {showUpiModal && upiModalLinks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative">
            <button onClick={() => setShowUpiModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">×</button>

            {/* Success icon */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #2d6a4f, #52b788)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-gray-800 mb-1">Request hua!</h3>
            <p className="text-gray-500 text-sm mb-5">Ab apni UPI app se neeche diye UPI ID par payment karein</p>

            {/* Amount */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: '#f0fdf4', border: '2px solid #86efac' }}>
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Kitna pay karein</p>
              <p className="text-4xl font-black text-green-700">₹{upiModalLinks.amount / 100}</p>
            </div>

            {/* UPI ID */}
            <div className="rounded-2xl p-4 mb-5" style={{ background: '#eff6ff', border: '2px solid #93c5fd' }}>
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">UPI ID (isko copy karein)</p>
              <p className="text-xl font-black text-blue-700 tracking-wide">itsjatinrai@ybl</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('itsjatinrai@ybl');
                  alert('UPI ID copy hua!');
                }}
                className="mt-2 px-4 py-1.5 rounded-lg text-sm font-bold text-white"
                style={{ background: '#2563eb' }}>
                Copy UPI ID
              </button>
            </div>

            {/* Steps */}
            <div className="text-left space-y-2 mb-5 bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Kaise pay karein:</p>
              {['Apni UPI app kholein (PhonePe / GPay / Paytm)', 'UPI ID search karein ya paste karein', `₹${upiModalLinks.amount / 100} enter karein aur pay karein`].map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5"
                    style={{ background: '#6366f1' }}>{i + 1}</span>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>

            <a href={`https://wa.me/919399974696?text=Fast%20Recharge%20request%20hua%20hai%20-%20%E2%82%B9${upiModalLinks.amount / 100}`}
              target="_blank" rel="noopener noreferrer"
              className="block w-full py-3 rounded-2xl font-bold text-white text-sm"
              style={{ background: '#25d366' }}>
              Help chahiye? WhatsApp karein
            </a>
          </div>
        </div>
      )}

      {showPrerequisiteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-100 text-center relative animate-scaleIn">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🔒
            </div>
            <h3 className="font-display text-xl font-bold text-gray-800 mb-2">
              Prerequisite Required
            </h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Recharge first with the base plan then only you can do ala carte top up
            </p>
            <button
              onClick={() => setShowPrerequisiteModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold transition-all active:scale-95 shadow-md"
            >
              Okay, Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

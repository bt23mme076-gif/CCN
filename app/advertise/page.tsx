'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { readBannerFile } from '@/lib/bannerImage';
import { launchPayu, PayuLaunchParams } from '@/lib/payments/payuClient';
import { useOperatorBranding } from '@/lib/useOperatorBranding';
import UpiPaymentModal from '@/components/UpiPaymentModal';
import StreamAdPreview, { AD_TYPE_LABELS, StreamAdType } from '@/components/StreamAdPreview';
import Navbar from '@/components/Navbar';
import { portalBg, glass, accentGradient } from '@/components/PortalUI';

interface AdPackage {
  id: string;
  ad_type: StreamAdType;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
}

// Reach figure shown to advertisers — same claim as the home page. Keep it true.
const HOUSEHOLDS = '2,000+';

const TYPE_INFO: Record<StreamAdType, { tagline: string; size: string; best: string }> = {
  full_screen: {
    tagline: 'Your banner fills the whole TV screen',
    size: '1920 × 1080 px (16:9 landscape)',
    best: 'Best for big announcements, grand openings and festival offers — maximum impact.',
  },
  l_shape: {
    tagline: 'Live program keeps playing, your ad wraps around it',
    size: '1920 × 1080 px — keep text on the right side & bottom strip; the top-left area is covered by the live video',
    best: 'Best for running all day without interrupting viewers — great for regular brand visibility.',
  },
};

const inputClass = 'w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-orange-500/50';
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' };

function todayIst() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function AdvertiseInner() {
  const searchParams = useSearchParams();
  const branding = useOperatorBranding();
  const initialType = searchParams.get('type') === 'l_shape' ? 'l_shape' : searchParams.get('type') === 'full_screen' ? 'full_screen' : null;

  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [adType, setAdType] = useState<StreamAdType | null>(initialType);
  const [packageId, setPackageId] = useState('');

  const [advertiserName, setAdvertiserName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState(todayIst());
  const [scrollText, setScrollText] = useState('');
  const [notes, setNotes] = useState('');
  const [banner, setBanner] = useState('');
  const [bannerBusy, setBannerBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [payOrder, setPayOrder] = useState<{ orderId: string; upiLink: string; amount: number } | null>(null);
  // Hero TV mock flips between the two formats so visitors see both.
  const [heroType, setHeroType] = useState<StreamAdType>('l_shape');
  useEffect(() => {
    const t = setInterval(() => setHeroType((x) => (x === 'l_shape' ? 'full_screen' : 'l_shape')), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/stream-ads/packages', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setPackages(data.packages || []))
      .catch(() => setError('Could not load ad packages. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  const typePackages = useMemo(() => packages.filter((p) => p.ad_type === adType), [packages, adType]);
  const selected = packages.find((p) => p.id === packageId) ?? null;
  const availableTypes = (['l_shape', 'full_screen'] as StreamAdType[]).filter((t) => packages.some((p) => p.ad_type === t));

  // Auto-pick when the chosen type has exactly one package.
  useEffect(() => {
    if (typePackages.length === 1) setPackageId(typePackages[0].id);
    else if (!typePackages.some((p) => p.id === packageId)) setPackageId('');
  }, [typePackages, packageId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setBannerBusy(true);
    try {
      setBanner(await readBannerFile(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use this image');
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setBannerBusy(false);
    }
  };

  const handlePay = async () => {
    setError('');
    if (!selected) { setError('Please choose an ad package'); return; }
    if (!banner) { setError('Please upload your banner image'); return; }
    if (advertiserName.trim().length < 2) { setError('Please enter your name'); return; }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) { setError('Enter a valid 10-digit mobile number'); return; }

    setPaying(true);
    try {
      const res = await fetch('/api/stream-ads/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selected.id,
          advertiserName: advertiserName.trim(),
          businessName: businessName.trim() || undefined,
          phone: phone.trim(),
          bannerData: banner,
          scrollText: scrollText.trim() || undefined,
          startDate,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to start payment');
        setPaying(false);
        return;
      }
      if (data.payu) {
        await launchPayu(data.payu as PayuLaunchParams, () => setPaying(false));
        return;
      }
      setPayOrder({ orderId: data.orderId, upiLink: data.upiLink, amount: data.amount });
      setPaying(false);
    } catch {
      setError('Failed to start payment. Please check your internet and try again.');
      setPaying(false);
    }
  };

  if (payOrder) {
    return (
      <UpiPaymentModal
        upiLink={payOrder.upiLink}
        amount={payOrder.amount}
        submitUtrUrl={`/api/stream-ads/${payOrder.orderId}/submit-utr`}
        onSubmitted={() => { window.location.href = `/advertise/status?order_id=${payOrder.orderId}`; }}
        onCancel={() => setPayOrder(null)}
        title="Pay for your Live Ad"
      />
    );
  }

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' };
  const minPrice = packages.length > 0 ? Math.min(...packages.map((p) => p.price)) : null;
  const phoneDigits = (branding.support_phone || '').replace(/\D/g, '').slice(-10);
  const waLink = phoneDigits
    ? `https://wa.me/91${phoneDigits}?text=${encodeURIComponent(`Hi, I want to advertise on ${branding.name} Live.`)}`
    : null;
  const scrollToBooking = () => document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen" style={portalBg}>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(247,127,0,0.22), transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-32 w-[30rem] h-[30rem] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)' }} />

        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-14 sm:pt-16 sm:pb-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {branding.name} Live · On Air
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-5">
              Put your business on{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #ffb703, #f77f00, #e63946)' }}>
                every TV in town
              </span>
            </h1>
            <p className="text-lg text-blue-100/80 mb-7 max-w-xl mx-auto lg:mx-0">
              Your banner on our live cable channel — seen by families in {HOUSEHOLDS} homes, on the biggest screen in the house.
              Book online in 2 minutes, go on air on the date you choose.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button onClick={scrollToBooking}
                className="px-7 py-4 rounded-xl font-bold text-white text-base transition-transform hover:-translate-y-0.5"
                style={{ background: accentGradient, boxShadow: '0 10px 30px rgba(230,57,70,0.4)' }}>
                {minPrice !== null ? `Book Your Ad — from ${formatCurrency(minPrice)}` : 'Book Your Ad'}
              </button>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="px-7 py-4 rounded-xl font-bold text-white text-base text-center transition-colors hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                  💬 Talk on WhatsApp
                </a>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start mt-6 text-sm text-blue-100/70">
              <span>✅ Reviewed before it airs</span>
              <span>✅ Pay securely online</span>
              <span>✅ Refund if we can&apos;t run it</span>
            </div>
          </div>

          {/* TV mock with a sample ad */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(247,127,0,0.25), transparent 70%)' }} />
            <div className="relative">
              <StreamAdPreview adType={heroType} banner="/ad-demo-banner.svg" scrollText="Sharma Electronics — Festive Sale 30% OFF — Main Market — Visit today!" />
              <div className="mx-auto w-1/3 h-3 rounded-b-xl" style={{ background: '#111' }} />
              <div className="mx-auto w-1/2 h-2 rounded-full mt-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {(['l_shape', 'full_screen'] as StreamAdType[]).map((t) => (
                <button key={t} onClick={() => setHeroType(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                  style={heroType === t
                    ? { background: 'rgba(247,127,0,0.25)', color: '#fff', border: '1px solid rgba(247,127,0,0.7)' }
                    : { color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {AD_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            <p className="text-center text-[11px] text-gray-500 mt-2">Sample ad — this is how your banner looks on TV</p>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { big: HOUSEHOLDS, small: 'connected homes' },
            { big: '📺', small: 'Big-screen TV, not a tiny phone' },
            { big: '👨‍👩‍👧', small: 'Whole families watching together' },
            { big: minPrice !== null ? formatCurrency(minPrice) : 'Local', small: minPrice !== null ? 'Starting price' : 'Your own area’s viewers' },
          ].map((s) => (
            <div key={s.small} className="rounded-2xl p-5 text-center" style={glass}>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{s.big}</p>
              <p className="text-xs sm:text-sm text-blue-100/70">{s.small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why advertise ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2" style={{ color: '#f5d27a' }}>Why TV advertising works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Reach customers right in their living room</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '📍', title: '100% local audience', text: 'Every viewer lives in our service area — the exact people who can walk into your shop.' },
            { icon: '👀', title: 'Impossible to scroll past', text: 'Your ad fills the TV screen. No skip button, no thumb flicking it away like on social media.' },
            { icon: '🔁', title: 'Seen again and again', text: 'Your banner stays on air for every day you book, so viewers see it repeatedly and remember you.' },
            { icon: '💸', title: 'Affordable, no agency', text: 'Book directly with us online — no middlemen, no hidden charges, transparent pricing.' },
          ].map((w) => (
            <div key={w.title} className="rounded-2xl p-6 transition-transform hover:-translate-y-1" style={glass}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: 'rgba(247,127,0,0.15)', border: '1px solid rgba(247,127,0,0.35)' }}>{w.icon}</div>
              <h3 className="font-bold text-white text-lg mb-2">{w.title}</h3>
              <p className="text-sm text-blue-100/70 leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ad formats ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2" style={{ color: '#f5d27a' }}>Ad formats</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Pick how your ad appears</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {(['l_shape', 'full_screen'] as StreamAdType[]).map((t) => {
            const typePrices = packages.filter((p) => p.ad_type === t).map((p) => p.price);
            return (
              <div key={t} className="rounded-3xl p-5 sm:p-6" style={glass}>
                <StreamAdPreview adType={t} banner="/ad-demo-banner.svg" className="mb-5" />
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-2xl font-bold text-white">{AD_TYPE_LABELS[t]}</h3>
                  {typePrices.length > 0 && (
                    <span className="text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap"
                      style={{ background: 'rgba(247,127,0,0.18)', color: '#ffb703', border: '1px solid rgba(247,127,0,0.4)' }}>
                      from {formatCurrency(Math.min(...typePrices))}
                    </span>
                  )}
                </div>
                <p className="text-blue-100/75 mb-3">{TYPE_INFO[t].tagline}</p>
                <p className="text-sm text-blue-100/60">{TYPE_INFO[t].best}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2" style={{ color: '#f5d27a' }}>How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">On air in 4 simple steps</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: '1', title: 'Choose your ad', text: 'Pick L-Shape or Full Screen and the number of days.' },
            { n: '2', title: 'Upload your banner', text: 'Add your poster image and an optional scrolling message. See a live TV preview instantly.' },
            { n: '3', title: 'Pay online', text: 'Pay securely by UPI or card. You get an order ID to track your booking.' },
            { n: '4', title: 'Go live', text: 'We review your banner and put it on air from your chosen date.' },
          ].map((s) => (
            <div key={s.n} className="relative rounded-2xl p-6" style={glass}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white mb-4"
                style={{ background: accentGradient, boxShadow: '0 6px 18px rgba(230,57,70,0.35)' }}>{s.n}</div>
              <h3 className="font-bold text-white text-lg mb-1.5">{s.title}</h3>
              <p className="text-sm text-blue-100/70 leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-blue-100/60 mb-3">Perfect for</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['🛍️ Shops & showrooms', '📚 Coaching classes', '🏥 Clinics & hospitals', '🍽️ Restaurants', '🎉 Events & samitis', '🏠 Real estate', '💍 Wedding & greetings', '🙏 Religious programs'].map((c) => (
              <span key={c} className="px-3.5 py-2 rounded-full text-sm text-white" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Booking ───────────────────────────────────────── */}
      <section id="book" className="max-w-2xl mx-auto px-4 pb-16 sm:pb-20 scroll-mt-6">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2" style={{ color: '#f5d27a' }}>Book now</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Book your ad</h2>
          <p className="text-blue-100/70 text-sm mt-3">Choose an ad type, upload your banner, pay online — we&apos;ll put it on air on your chosen date.</p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-3xl p-8 text-center" style={glass}>
            <div className="text-4xl mb-3">📅</div>
            <h3 className="font-display text-2xl font-bold text-white mb-2">Online booking opens soon</h3>
            <p className="text-blue-100/70 text-sm mb-6">
              Want to advertise right away? Contact us and we&apos;ll set up your ad personally.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl font-bold text-white" style={{ background: '#16a34a', boxShadow: '0 8px 24px rgba(22,163,74,0.35)' }}>
                  💬 WhatsApp us
                </a>
              )}
              {phoneDigits && (
                <a href={`tel:+91${phoneDigits}`} className="px-6 py-3 rounded-xl font-bold text-white" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
                  📞 Call {branding.support_phone}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1 — type */}
            <section className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
              <h2 className="text-white font-bold mb-4"><span className="text-accent-orange">1.</span> Choose ad type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableTypes.map((t) => {
                  const active = adType === t;
                  const from = Math.min(...packages.filter((p) => p.ad_type === t).map((p) => p.price));
                  return (
                    <button key={t} type="button" onClick={() => setAdType(t)}
                      className="text-left rounded-2xl p-3 transition-all hover:scale-[1.02]"
                      style={{
                        background: active ? 'linear-gradient(135deg, rgba(230,57,70,0.2), rgba(247,127,0,0.12))' : 'rgba(255,255,255,0.04)',
                        border: active ? '2px solid #f77f00' : '2px solid rgba(255,255,255,0.1)',
                      }}>
                      <StreamAdPreview adType={t} className="mb-3" />
                      <p className="font-bold text-white">{AD_TYPE_LABELS[t]}</p>
                      <p className="text-xs text-blue-200/70 mt-0.5">{TYPE_INFO[t].tagline}</p>
                      <p className="text-xs text-accent-orange font-semibold mt-1">from {formatCurrency(from)}</p>
                    </button>
                  );
                })}
              </div>
            </section>
            {/* Step 2 — package */}
            {adType && (
              <section className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
                <h2 className="text-white font-bold mb-4"><span className="text-accent-orange">2.</span> Choose package</h2>
                <div className="space-y-3">
                  {typePackages.map((p) => {
                    const active = packageId === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setPackageId(p.id)}
                        className="w-full text-left rounded-2xl p-4 transition-all"
                        style={{
                          background: active ? 'linear-gradient(135deg, rgba(230,57,70,0.18), rgba(247,127,0,0.12))' : 'rgba(255,255,255,0.05)',
                          border: active ? '1px solid rgba(247,127,0,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        }}>
                        <div className="flex justify-between items-center gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-xs text-blue-300/70 mt-0.5">{p.duration_days} {p.duration_days === 1 ? 'day' : 'days'} on air</p>
                            {p.description && <p className="text-xs text-gray-400 mt-1 whitespace-pre-line">{p.description}</p>}
                          </div>
                          <p className="font-black text-lg text-transparent bg-clip-text flex-shrink-0"
                            style={{ backgroundImage: 'linear-gradient(90deg, #ff8fa3, #ffb703)' }}>
                            {formatCurrency(p.price)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Step 3 — banner & details */}
            {selected && adType && (
              <section className="rounded-2xl p-5 sm:p-6 space-y-4" style={cardStyle}>
                <h2 className="text-white font-bold"><span className="text-accent-orange">3.</span> Upload banner &amp; details</h2>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Banner image *</label>
                  <p className="text-xs text-gray-400 mb-2">Recommended size: {TYPE_INFO[adType].size}. JPG or PNG.</p>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile}
                    className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-600 file:text-white hover:file:bg-orange-700 file:cursor-pointer cursor-pointer" />
                  {bannerBusy && <p className="text-xs text-gray-400 mt-2">Preparing image…</p>}
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Preview on TV</p>
                  <StreamAdPreview adType={adType} banner={banner} scrollText={scrollText} />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Scrolling text (optional)</label>
                  <input value={scrollText} onChange={(e) => setScrollText(e.target.value)} maxLength={300}
                    placeholder="e.g. Contact for bookings: 98xxxxxxxx" className={inputClass} style={inputStyle} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Your name *</label>
                    <input value={advertiserName} onChange={(e) => setAdvertiserName(e.target.value)} maxLength={80}
                      placeholder="Full name" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Mobile number *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      inputMode="numeric" placeholder="10-digit mobile" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Business / Samiti (optional)</label>
                    <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} maxLength={120}
                      placeholder="e.g. Sharma Medical Store" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Start date *</label>
                    <input type="date" value={startDate} min={todayIst()} onChange={(e) => setStartDate(e.target.value)}
                      className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-300/70 mb-2">Message for us (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3}
                    placeholder="Preferred time slot, event details, etc." className={inputClass} style={inputStyle} />
                </div>
              </section>
            )}

            {error && (
              <div className="rounded-xl p-3.5 text-sm text-red-200"
                style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.35)' }}>
                {error}
              </div>
            )}

            {selected && (
              <div className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-blue-200/80">{AD_TYPE_LABELS[selected.ad_type]} · {selected.name}</span>
                  <span className="font-black text-xl text-white">{formatCurrency(selected.price)}</span>
                </div>
                <button onClick={handlePay} disabled={paying || bannerBusy}
                  className="btn-gradient w-full py-3.5 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed">
                  {paying ? 'Starting payment…' : `Pay ${formatCurrency(selected.price)} & Submit`}
                </button>
                <p className="text-[11px] text-gray-400 text-center mt-3">
                  Your banner is reviewed before going live. If we can&apos;t run it, we&apos;ll contact you for a change or refund.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-16 sm:pb-20">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] font-bold mb-2" style={{ color: '#f5d27a' }}>FAQ</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Questions advertisers ask</h2>
        </div>
        <div className="space-y-3">
          {[
            { q: 'When will my ad go on air?', a: 'From the start date you choose while booking. We review every banner first, usually the same day.' },
            { q: 'What if my banner is not approved?', a: 'We will call you to fix it. If we still cannot run it, you get a refund.' },
            { q: 'What size should my banner be?', a: '1920 × 1080 pixels (16:9), JPG or PNG. For L-Shape, keep your text on the right side and the bottom strip — the top-left area shows the live program.' },
            { q: 'I don’t have a banner. Can you help?', a: 'Yes — message us on WhatsApp with your shop details and offer, and we will help you get one ready.' },
            { q: 'How do I pay?', a: 'Online by UPI (or card where available). You get an order ID right away to track your booking.' },
          ].map((item) => (
            <details key={item.q} className="group rounded-2xl px-5 py-4" style={glass}>
              <summary className="flex justify-between items-center gap-4 cursor-pointer list-none font-semibold text-white">
                {item.q}
                <span className="text-xl text-orange-300 transition-transform group-open:rotate-45 flex-shrink-0">+</span>
              </summary>
              <p className="text-sm text-blue-100/75 mt-3 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center"
          style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #b91c1c 50%, #f59e0b 130%)', boxShadow: '0 25px 70px rgba(185,28,28,0.35)' }}>
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
          <h2 className="relative font-display text-3xl sm:text-4xl font-bold text-white mb-3">Your next customer is watching TV right now</h2>
          <p className="relative text-white/85 mb-7 max-w-xl mx-auto">Get your business in front of {HOUSEHOLDS} local homes — book in 2 minutes.</p>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={scrollToBooking} className="px-7 py-4 rounded-xl font-bold text-red-800 bg-white transition-transform hover:-translate-y-0.5"
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
              Book Your Ad Now
            </button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-7 py-4 rounded-xl font-bold text-white"
                style={{ border: '1px solid rgba(255,255,255,0.5)' }}>
                💬 WhatsApp us
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function AdvertisePage() {
  return (
    <Suspense fallback={null}>
      <AdvertiseInner />
    </Suspense>
  );
}

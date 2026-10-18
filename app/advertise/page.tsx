'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { readBannerFile } from '@/lib/bannerImage';
import { launchPayu, PayuLaunchParams } from '@/lib/payments/payuClient';
import { useOperatorBranding } from '@/lib/useOperatorBranding';
import UpiPaymentModal from '@/components/UpiPaymentModal';
import StreamAdPreview, { AD_TYPE_LABELS, StreamAdType } from '@/components/StreamAdPreview';

interface AdPackage {
  id: string;
  ad_type: StreamAdType;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
}

const TYPE_INFO: Record<StreamAdType, { tagline: string; size: string }> = {
  full_screen: {
    tagline: 'Your banner fills the whole TV screen',
    size: '1920 × 1080 px (16:9 landscape)',
  },
  l_shape: {
    tagline: 'Live program keeps playing, your ad wraps around it',
    size: '1920 × 1080 px — keep text on the right side & bottom strip; the top-left area is covered by the live video',
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

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-[11px] font-bold tracking-widest uppercase text-accent-orange mb-2">📺 {branding.name} Live</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Advertise on our Live Stream</h1>
          <p className="text-blue-200/80 text-sm mt-3">
            Choose an ad type, upload your banner, pay online — we&apos;ll put it on air on your chosen date.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl p-8 text-center text-blue-200/80 text-sm" style={cardStyle}>
            Ad bookings are not open right now. Please contact us{branding.support_phone ? ` on ${branding.support_phone}` : ''}.
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
      </div>
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency, formatDateDMY } from '@/lib/utils';
import { readBannerFile } from '@/lib/bannerImage';
import StreamAdPreview, { AD_TYPE_LABELS, StreamAdType } from '@/components/StreamAdPreview';

interface Booking {
  id: string;
  package_id: string | null;
  ad_type: StreamAdType;
  package_name: string;
  duration_days: number;
  amount: number;
  advertiser_name: string;
  business_name: string | null;
  phone: string;
  scroll_text: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  admin_note: string | null;
  status: string;
  upi_reference: string | null;
  paid_at: string | null;
  created_at: string;
  banner_data?: string;
}

interface AdPackage {
  id: string;
  ad_type: StreamAdType;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
}

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Unpaid', cls: 'bg-gray-700 text-gray-300' },
  paid: { label: 'Paid — Review', cls: 'bg-yellow-500/20 text-yellow-300' },
  approved: { label: 'Approved', cls: 'bg-blue-500/20 text-blue-300' },
  live: { label: 'Live', cls: 'bg-red-500/20 text-red-300' },
  completed: { label: 'Completed', cls: 'bg-green-500/20 text-green-300' },
  rejected: { label: 'Rejected', cls: 'bg-red-900/40 text-red-300' },
  failed: { label: 'Payment Failed', cls: 'bg-gray-800 text-gray-400' },
};

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'active', label: 'Paid & Active', match: (s) => ['paid', 'approved', 'live'].includes(s) },
  { key: 'paid', label: 'Needs Review', match: (s) => s === 'paid' },
  { key: 'live', label: 'Live', match: (s) => s === 'live' },
  { key: 'done', label: 'Completed', match: (s) => s === 'completed' },
  { key: 'rejected', label: 'Rejected', match: (s) => s === 'rejected' },
  { key: 'unpaid', label: 'Unpaid / Failed', match: (s) => s === 'pending' || s === 'failed' },
  { key: 'all', label: 'All', match: () => true },
];

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500';
const cardBg = 'rgba(255,255,255,0.04)';
const border = '1px solid rgba(99,102,241,0.15)';

function toDateInput(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function isAndroidWebView() {
  if (typeof window === 'undefined') return false;
  if ((window as any).Android) return true;
  const ua = navigator.userAgent;
  return /wv\b/.test(ua) || (/Android/.test(ua) && /Version\/\d/.test(ua) && !/Chrome\//.test(ua));
}

export default function StreamAdsPage() {
  const [tab, setTab] = useState<'bookings' | 'packages'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('active');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/stream-ads', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
      setPackages(data.packages || []);
      setLoadError('');
    } else {
      setLoadError('Could not load live ads. If this is the first time, run the database migration (Super Admin → Run Migrations).');
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    setShareUrl(`${window.location.origin}/advertise`);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const shareText = encodeURIComponent(`📺 Advertise on our LIVE stream!\nL-Shape & Full Screen banners — book and pay online:\n${shareUrl}`);
  const filtered = bookings.filter((b) => FILTERS.find((f) => f.key === filter)!.match(b.status));
  const needsReview = bookings.filter((b) => b.status === 'paid').length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Live Stream Ads</h1>
        <p className="text-gray-400 text-sm mt-1">Paid L-Shape and Full Screen banner bookings for the live stream.</p>
      </div>

      {/* Share link */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.12), rgba(247,127,0,0.08))', border: '1px solid rgba(247,127,0,0.3)' }}>
        <p className="text-white font-semibold text-sm mb-2">🔗 Booking link — share with advertisers</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input readOnly value={shareUrl} className={`${inputCls} font-mono`} onFocus={(e) => e.target.select()} />
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={copyLink} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20">
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
            <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              WhatsApp
            </a>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Direct links: <span className="font-mono">{shareUrl}?type=l_shape</span> · <span className="font-mono">{shareUrl}?type=full_screen</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['bookings', 'packages'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'text-white' : 'text-gray-400 bg-white/5 hover:text-white'}`}
            style={tab === t ? { background: 'linear-gradient(135deg, #e63946, #f77f00)' } : undefined}>
            {t === 'bookings' ? `Bookings${needsReview ? ` (${needsReview} new)` : ''}` : `Packages & Prices (${packages.length})`}
          </button>
        ))}
      </div>

      {loadError && <p className="text-red-400 text-sm mb-4">{loadError}</p>}

      {tab === 'bookings' ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border }}>
          <div className="px-4 py-3 border-b border-white/10 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f.key ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                {f.label} ({bookings.filter((b) => f.match(b.status)).length})
              </button>
            ))}
          </div>
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No bookings here.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((b) => {
                const st = STATUS_STYLES[b.status] ?? { label: b.status, cls: 'bg-gray-700 text-gray-300' };
                return (
                  <button key={b.id} onClick={() => setEditingId(b.id)} className="w-full text-left flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-white/5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white text-center leading-tight"
                      style={{ background: b.ad_type === 'l_shape' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                      {b.ad_type === 'l_shape' ? 'L' : 'FULL'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {b.advertiser_name}{b.business_name ? ` · ${b.business_name}` : ''}
                      </p>
                      <p className="text-gray-400 text-xs truncate">
                        {AD_TYPE_LABELS[b.ad_type] ?? b.ad_type} · {b.package_name} · {formatCurrency(b.amount)} · {b.phone}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        {b.start_date && (
                          <span className="text-xs text-gray-500">
                            {formatDateDMY(b.start_date)}{b.end_date && toDateInput(b.end_date) !== toDateInput(b.start_date) ? ` – ${formatDateDMY(b.end_date)}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm flex-shrink-0">Edit →</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <PackagesManager packages={packages} onChange={load} />
      )}

      {editingId && (
        <BookingEditor
          id={editingId}
          packages={packages}
          onClose={() => setEditingId(null)}
          onSaved={() => { setEditingId(null); load(); }}
        />
      )}
    </div>
  );
}

function BookingEditor({ id, packages, onClose, onSaved }: { id: string; packages: AdPackage[]; onClose: () => void; onSaved: () => void }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState('');
  const [bannerChanged, setBannerChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inWebView, setInWebView] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInWebView(isAndroidWebView());
    fetch(`/api/admin/stream-ads/${id}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const b: Booking = data.booking;
        if (!b) { setError(data.error || 'Booking not found'); return; }
        setBooking(b);
        setBanner(b.banner_data || '');
        setForm({
          status: b.status,
          ad_type: b.ad_type,
          package_name: b.package_name,
          amount: String(b.amount / 100),
          duration_days: String(b.duration_days),
          advertiser_name: b.advertiser_name,
          business_name: b.business_name || '',
          phone: b.phone,
          scroll_text: b.scroll_text || '',
          start_date: toDateInput(b.start_date),
          end_date: toDateInput(b.end_date),
          notes: b.notes || '',
          admin_note: b.admin_note || '',
          upi_reference: b.upi_reference || '',
        });
      })
      .catch(() => setError('Failed to load booking'));
  }, [id]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (overrides: Record<string, string> = {}) => {
    const data = { ...form, ...overrides };
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/stream-ads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        amount: Math.round(Number(data.amount) * 100),
        duration_days: Number(data.duration_days),
        ...(bannerChanged ? { banner_data: banner } : {}),
      }),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else setError((await res.json()).error || 'Failed to save');
  };

  const remove = async () => {
    if (!confirm('Delete this booking permanently? This cannot be undone.')) return;
    await fetch(`/api/admin/stream-ads/${id}`, { method: 'DELETE' });
    onSaved();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBanner(await readBannerFile(file));
      setBannerChanged(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use this image');
    }
  };

  const ext = banner.startsWith('data:image/png') ? 'png' : 'jpg';
  const fileName = `${(form.business_name || form.advertiser_name || 'ad').replace(/[^a-z0-9]+/gi, '_')}_${form.ad_type}.${ext}`;
  const field = (label: string, key: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      <input value={form[key] ?? ''} onChange={set(key)} className={inputCls} {...props} />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl my-6" style={{ background: '#15132e', border }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold">Edit Live Ad Booking</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {!booking ? (
          <div className="py-12 text-center text-sm">{error ? <span className="text-red-400">{error}</span> : <span className="text-gray-500">Loading...</span>}</div>
        ) : (
          <div className="p-5 space-y-5">
            <div>
              <StreamAdPreview adType={(form.ad_type as StreamAdType) || 'full_screen'} banner={banner} scrollText={form.scroll_text} />
              <div className="flex flex-wrap gap-2 mt-3">
                {banner && (
                  <a href={banner} download={fileName}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-700">
                    ⬇ Download banner (for OBS)
                  </a>
                )}
                {form.scroll_text && (
                  <button onClick={() => navigator.clipboard?.writeText(form.scroll_text)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20">
                    Copy scroll text
                  </button>
                )}
                {inWebView ? (
                  <span className="text-xs text-yellow-200 self-center">Open in Chrome to replace the banner.</span>
                ) : (
                  <label className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 cursor-pointer">
                    Replace banner
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  </label>
                )}
                <a href={`https://wa.me/91${form.phone}`} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700">
                  WhatsApp advertiser
                </a>
              </div>
            </div>

            {/* Quick status actions */}
            <div className="flex flex-wrap gap-2">
              {[
                { s: 'approved', label: '✅ Approve', cls: 'bg-blue-600 hover:bg-blue-700' },
                { s: 'live', label: '📺 Mark Live', cls: 'bg-red-600 hover:bg-red-700' },
                { s: 'completed', label: '🏁 Completed', cls: 'bg-green-600 hover:bg-green-700' },
                { s: 'rejected', label: '⚠️ Reject', cls: 'bg-gray-700 hover:bg-gray-600' },
              ].filter((a) => a.s !== form.status).map((a) => (
                <button key={a.s} disabled={saving} onClick={() => save({ status: a.s })}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 ${a.cls}`}>
                  {a.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Status</label>
                <select value={form.status} onChange={set('status')} className={inputCls} style={{ colorScheme: 'dark' }}>
                  {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Ad type</label>
                <select value={form.ad_type} onChange={set('ad_type')} className={inputCls} style={{ colorScheme: 'dark' }}>
                  <option value="l_shape">L-Shape</option>
                  <option value="full_screen">Full Screen</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Package</label>
                <input value={form.package_name} onChange={set('package_name')} className={inputCls} list="stream-ad-package-names" />
                <datalist id="stream-ad-package-names">
                  {packages.map((p) => <option key={p.id} value={p.name} />)}
                </datalist>
              </div>
              {field('Amount (₹)', 'amount', { type: 'number', min: 0 })}
              {field('Advertiser name', 'advertiser_name')}
              {field('Business / Samiti', 'business_name')}
              {field('Mobile', 'phone')}
              {field('Days', 'duration_days', { type: 'number', min: 1 })}
              {field('Start date', 'start_date', { type: 'date', style: { colorScheme: 'dark' } })}
              {field('End date', 'end_date', { type: 'date', style: { colorScheme: 'dark' } })}
              {field('Payment reference', 'upi_reference')}
              <div className="text-xs text-gray-500 self-end pb-2">
                Booked {formatDateDMY(booking.created_at)}{booking.paid_at ? ` · Paid ${formatDateDMY(booking.paid_at)}` : ''}<br />
                <span className="font-mono">{booking.id}</span>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs mb-1">Scrolling text</label>
              <input value={form.scroll_text} onChange={set('scroll_text')} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Advertiser&apos;s message</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3} className={inputCls} />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Note shown to advertiser (status page)</label>
                <textarea value={form.admin_note} onChange={set('admin_note')} rows={3} className={inputCls} />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={remove} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20">
                Delete
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-gray-300 bg-white/5 hover:bg-white/10">Cancel</button>
                <button onClick={() => save()} disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_PKG = { ad_type: 'l_shape', name: '', description: '', price: '', duration_days: '1' };

function PackagesManager({ packages, onChange }: { packages: AdPackage[]; onChange: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(EMPTY_PKG);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const startEdit = (p: AdPackage) => {
    setEditingId(p.id);
    setForm({ ad_type: p.ad_type, name: p.name, description: p.description || '', price: String(p.price / 100), duration_days: String(p.duration_days) });
    setError('');
  };

  const reset = () => { setEditingId(null); setForm(EMPTY_PKG); setError(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, price: Math.round(Number(form.price) * 100), duration_days: Number(form.duration_days) };
    const res = await fetch(editingId ? `/api/admin/stream-ads/packages/${editingId}` : '/api/admin/stream-ads/packages', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) { reset(); onChange(); }
    else setError((await res.json()).error || 'Failed to save package');
  };

  const toggle = async (p: AdPackage) => {
    await fetch(`/api/admin/stream-ads/packages/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    onChange();
  };

  const remove = async (p: AdPackage) => {
    if (!confirm(`Delete package "${p.name}"? Existing bookings keep their details.`)) return;
    await fetch(`/api/admin/stream-ads/packages/${p.id}`, { method: 'DELETE' });
    if (editingId === p.id) reset();
    onChange();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5" style={{ background: cardBg, border }}>
        <h2 className="text-white font-semibold mb-4">{editingId ? 'Edit package' : 'Add package'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Ad type</label>
              <select value={form.ad_type} onChange={set('ad_type')} className={inputCls} style={{ colorScheme: 'dark' }}>
                <option value="l_shape">L-Shape</option>
                <option value="full_screen">Full Screen</option>
              </select>
            </div>
            <div className="sm:col-span-1">
              <label className="block text-gray-400 text-xs mb-1">Name</label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. 1 Day L-Shape" className={inputCls} />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Price (₹)</label>
              <input type="number" min={1} value={form.price} onChange={set('price')} placeholder="500" className={inputCls} />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Days on air</label>
              <input type="number" min={1} value={form.duration_days} onChange={set('duration_days')} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Description shown to advertisers (optional)</label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              placeholder="e.g. Shown every 15 minutes during evening aarti broadcast" className={inputCls} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
              {saving ? 'Saving...' : editingId ? 'Save package' : 'Add package'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="px-4 py-2 rounded-xl text-sm text-gray-300 bg-white/5 hover:bg-white/10">Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border }}>
        {packages.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No packages yet — the booking page stays closed until you add one.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {packages.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-4 sm:px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">
                    {p.name} <span className="text-gray-400 font-normal">· {AD_TYPE_LABELS[p.ad_type] ?? p.ad_type}</span>
                  </p>
                  <p className="text-gray-400 text-xs">{formatCurrency(p.price)} · {p.duration_days} {p.duration_days === 1 ? 'day' : 'days'}</p>
                  {p.description && <p className="text-gray-500 text-xs truncate">{p.description}</p>}
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {p.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="flex flex-wrap justify-end gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white hover:bg-white/20">Edit</button>
                  <button onClick={() => toggle(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600">
                    {p.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => remove(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

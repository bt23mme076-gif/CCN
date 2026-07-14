'use client';

import { useEffect, useRef, useState } from 'react';

interface Ad {
  id: string;
  business_name: string;
  image_data: string;
  phone: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageData, setImageData] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAds = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/advertisements');
    if (res.ok) {
      const data = await res.json();
      setAds(data.advertisements || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAds(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImageData(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) { setError('Business name is required'); return; }
    if (!imageData) { setError('Please select an image'); return; }
    setError('');
    setSaving(true);
    const res = await fetch('/api/admin/advertisements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: businessName,
        image_data: imageData,
        phone: phone || null,
        expires_at: expiresAt || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSuccess('Poster added successfully!');
      setBusinessName('');
      setPhone('');
      setExpiresAt('');
      setImageData('');
      setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setSuccess(''), 3000);
      fetchAds();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to add poster');
    }
  };

  const toggleActive = async (ad: Ad) => {
    await fetch(`/api/admin/advertisements/${ad.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !ad.is_active }),
    });
    fetchAds();
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Delete this poster?')) return;
    await fetch(`/api/admin/advertisements/${id}`, { method: 'DELETE' });
    fetchAds();
  };

  const cardBg = 'rgba(255,255,255,0.04)';
  const border = '1px solid rgba(99,102,241,0.15)';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Advertisements</h1>
        <p className="text-gray-400 text-sm mt-1">Upload business posters — they appear live on the homepage below the A La Carte section.</p>
      </div>

      {/* Add Poster Form */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: cardBg, border }}>
        <h2 className="text-white font-semibold text-lg mb-5">Add New Poster</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Business Name *</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sharma Medical Store"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Contact Number (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Poster Image * (max 2 MB)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Expiry Date (optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {imagePreview && (
            <div className="relative w-full max-w-xs rounded-xl overflow-hidden border border-white/10">
              <img src={imagePreview} alt="Preview" className="w-full object-contain max-h-48" />
              <button
                type="button"
                onClick={() => { setImagePreview(''); setImageData(''); if (fileRef.current) fileRef.current.value = ''; }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}
          >
            {saving ? 'Uploading...' : 'Add Poster'}
          </button>
        </form>
      </div>

      {/* Ads List */}
      <div className="rounded-2xl overflow-hidden" style={{ background: cardBg, border }}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold">All Posters ({ads.length})</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading...</div>
        ) : ads.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No posters yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {ads.map((ad) => {
              const expired = ad.expires_at ? new Date(ad.expires_at) < new Date() : false;
              return (
                <div key={ad.id} className="flex items-center gap-4 px-6 py-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                    <img src={ad.image_data} alt={ad.business_name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{ad.business_name}</p>
                    {ad.phone && <p className="text-gray-400 text-xs">{ad.phone}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        expired ? 'bg-gray-700 text-gray-400' :
                        ad.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {expired ? 'Expired' : ad.is_active ? 'Active' : 'Hidden'}
                      </span>
                      {ad.expires_at && (
                        <span className="text-xs text-gray-500">
                          Expires {new Date(ad.expires_at).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(ad)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        ad.is_active
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                      }`}
                    >
                      {ad.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => deleteAd(ad.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

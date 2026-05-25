'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bulletin bar state
  const [bulletinText, setBulletinText] = useState('');
  const [bulletinActive, setBulletinActive] = useState(true);
  const [bulletinSpeed, setBulletinSpeed] = useState(30);
  const [bulletinSaving, setBulletinSaving] = useState(false);
  const [bulletinMsg, setBulletinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/announcement')
      .then((r) => r.json())
      .then((data) => {
        if (data.announcement) {
          setBulletinText(data.announcement.text);
          setBulletinActive(data.announcement.is_active);
          setBulletinSpeed(data.announcement.speed ?? 30);
        }
      })
      .catch(() => {});
  }, []);

  const handleBulletinSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulletinMsg(null);
    setBulletinSaving(true);
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bulletinText, is_active: bulletinActive, speed: bulletinSpeed }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulletinMsg({ type: 'success', text: 'Bulletin bar updated successfully!' });
      } else {
        setBulletinMsg({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch {
      setBulletinMsg({ type: 'error', text: 'Failed to update bulletin bar' });
    } finally {
      setBulletinSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    // Validate password length
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Change password error:', error);
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-6 sm:mb-8">
        Settings
      </h1>

      <div className="max-w-2xl">
        <div className="card">
          <h2 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-4 sm:mb-6">
            Change Password
          </h2>

          {message && (
            <div
              className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                  {message.type === 'success' ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="input-field"
                required
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="input-field"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input-field"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {submitting ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        <div className="card mt-4 sm:mt-6">
          <h2 className="font-display text-lg sm:text-xl font-bold text-brand-navy mb-4">
            Admin Information
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong className="text-brand-navy">Username:</strong> admin</p>
            <p><strong className="text-brand-navy">Role:</strong> Administrator</p>
            <p className="text-xs text-gray-500 mt-4">
              For security reasons, keep your password secure and change it regularly.
            </p>
          </div>
        </div>

        {/* Bulletin Bar Settings */}
        <div className="card mt-4 sm:mt-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
              <span className="text-white text-lg">📢</span>
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-brand-navy">
                Bulletin Bar
              </h2>
              <p className="text-xs text-gray-500">Announcement shown below the navbar on all pages</p>
            </div>
          </div>

          {bulletinMsg && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              bulletinMsg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {bulletinMsg.text}
            </div>
          )}

          <form onSubmit={handleBulletinSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Text
              </label>
              <textarea
                value={bulletinText}
                onChange={(e) => setBulletinText(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="e.g. 📺 New plans available! Recharge now and enjoy 200+ channels."
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                You can use emojis to make it more eye-catching.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBulletinActive(!bulletinActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  bulletinActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  bulletinActive ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {bulletinActive ? '✅ Bulletin bar is visible to customers' : '❌ Bulletin bar is hidden'}
              </span>
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Scroll Speed
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  ({bulletinSpeed}s per cycle — lower = faster)
                </span>
              </label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-accent-red font-semibold w-12">Fast</span>
                <input
                  type="range"
                  min={5}
                  max={80}
                  step={5}
                  value={bulletinSpeed}
                  onChange={(e) => setBulletinSpeed(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-accent-red"
                />
                <span className="text-xs text-gray-400 font-semibold w-12 text-right">Slow</span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-12">
                <span>5s</span>
                <span>20s</span>
                <span>40s</span>
                <span>60s</span>
                <span>80s</span>
              </div>
              {/* Speed presets */}
              <div className="flex gap-2 mt-3">
                {[{ label: 'Fast', val: 10 }, { label: 'Normal', val: 30 }, { label: 'Slow', val: 60 }].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setBulletinSpeed(p.val)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      bulletinSpeed === p.val
                        ? 'bg-accent-red text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live preview */}
            {bulletinText && bulletinActive && (
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Preview</p>
                <div className="rounded-lg overflow-hidden"
                  style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #e63946 35%, #f77f00 65%, #1a1a2e 100%)' }}>
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="bg-white/15 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full" />
                      Notice
                    </span>
                    <p className="text-white text-xs font-medium text-center flex-1">{bulletinText}</p>
                    <span className="text-white/40 text-xs">✕</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={bulletinSaving}
              className="btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {bulletinSaving ? 'Saving...' : 'Save Bulletin Bar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

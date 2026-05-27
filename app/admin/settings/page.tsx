'use client';

import { useState, useEffect } from 'react';

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' };
const labelStyle = 'block text-sm font-medium text-gray-300 mb-2';

function AdminInput({ label, type = 'password', value, onChange, placeholder, hint, autoComplete }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
        style={inputStyle}
        onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        required />
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function Alert({ type, text, onClose }: { type: 'success' | 'error'; text: string; onClose?: () => void }) {
  return (
    <div className="p-3 rounded-xl flex items-center gap-3 text-sm font-medium mb-4"
      style={type === 'success'
        ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
        : { background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)', color: '#f87171' }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      <span className="flex-1">{text}</span>
      {onClose && <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs">✕</button>}
    </div>
  );
}

export default function SettingsPage() {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [bulletinText, setBulletinText] = useState('');
  const [bulletinActive, setBulletinActive] = useState(true);
  const [bulletinSpeed, setBulletinSpeed] = useState(30);
  const [bulletinSaving, setBulletinSaving] = useState(false);
  const [bulletinMsg, setBulletinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/announcement').then((r) => r.json()).then((data) => {
      if (data.announcement) {
        setBulletinText(data.announcement.text);
        setBulletinActive(data.announcement.is_active);
        setBulletinSpeed(data.announcement.speed ?? 30);
      }
    }).catch(() => {});
  }, []);

  const handleBulletinSave = async (e: React.FormEvent) => {
    e.preventDefault(); setBulletinMsg(null); setBulletinSaving(true);
    try {
      const res = await fetch('/api/admin/announcement', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: bulletinText, is_active: bulletinActive, speed: bulletinSpeed }) });
      const data = await res.json();
      setBulletinMsg(res.ok ? { type: 'success', text: 'Bulletin bar updated!' } : { type: 'error', text: data.error || 'Failed to update' });
    } catch { setBulletinMsg({ type: 'error', text: 'Failed to update bulletin bar' }); }
    finally { setBulletinSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(null);
    if (formData.newPassword !== formData.confirmPassword) { setMessage({ type: 'error', text: 'New passwords do not match' }); return; }
    if (formData.newPassword.length < 6) { setMessage({ type: 'error', text: 'New password must be at least 6 characters' }); return; }
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: formData.currentPassword, newPassword: formData.newPassword }) });
      const data = await response.json();
      if (response.ok) { setMessage({ type: 'success', text: 'Password changed successfully!' }); setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else setMessage({ type: 'error', text: data.error || 'Failed to change password' });
    } catch { setMessage({ type: 'error', text: 'Failed to change password' }); }
    finally { setSubmitting(false); }
  };

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Settings</h1>

      <div className="max-w-2xl space-y-5">

        {/* Change Password */}
        <div className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.3)' }}>
              <span className="text-lg">🔐</span>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Change Password</h2>
              <p className="text-xs text-gray-500">Update your admin login password</p>
            </div>
          </div>
          {message && <Alert type={message.type} text={message.text} onClose={() => setMessage(null)} />}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AdminInput label="Current Password" value={formData.currentPassword} onChange={(v) => setFormData({ ...formData, currentPassword: v })} placeholder="Enter current password" autoComplete="current-password" />
            <AdminInput label="New Password" value={formData.newPassword} onChange={(v) => setFormData({ ...formData, newPassword: v })} placeholder="Enter new password" hint="Must be at least 6 characters" autoComplete="new-password" />
            <AdminInput label="Confirm New Password" value={formData.confirmPassword} onChange={(v) => setFormData({ ...formData, confirmPassword: v })} placeholder="Re-enter new password" autoComplete="new-password" />
            <button type="submit" disabled={submitting}
              className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Admin Info */}
        <div className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.2))', border: '1px solid rgba(52,211,153,0.3)' }}>
              <span className="text-lg">👤</span>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Admin Information</h2>
              <p className="text-xs text-gray-500">Your account details</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-gray-400">Username</span>
              <span className="text-white font-semibold">admin</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-gray-400">Role</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(230,57,70,0.15)', color: '#f87171', border: '1px solid rgba(230,57,70,0.3)' }}>Administrator</span>
            </div>
          </div>
        </div>

        {/* Bulletin Bar */}
        <div className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.25), rgba(247,127,0,0.2))', border: '1px solid rgba(230,57,70,0.3)' }}>
              <span className="text-lg">📢</span>
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Bulletin Bar</h2>
              <p className="text-xs text-gray-500">Scrolling announcement shown below the navbar</p>
            </div>
          </div>

          {bulletinMsg && <Alert type={bulletinMsg.type} text={bulletinMsg.text} onClose={() => setBulletinMsg(null)} />}

          <form onSubmit={handleBulletinSave} className="space-y-5">
            {/* Text */}
            <div>
              <label className={labelStyle}>Announcement Text</label>
              <textarea value={bulletinText} onChange={(e) => setBulletinText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder-gray-500 transition-all resize-none"
                style={inputStyle} rows={3}
                placeholder="📺 New plans available! Recharge now and enjoy 200+ channels."
                onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                required />
              <p className="text-xs text-gray-500 mt-1">You can use emojis to make it eye-catching.</p>
            </div>

            {/* Toggle */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setBulletinActive(!bulletinActive)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                style={{ background: bulletinActive ? '#22c55e' : 'rgba(255,255,255,0.15)' }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bulletinActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm font-medium" style={{ color: bulletinActive ? '#34d399' : '#9ca3af' }}>
                {bulletinActive ? '✅ Visible to customers' : '❌ Hidden from customers'}
              </span>
            </div>

            {/* Speed */}
            <div>
              <label className={labelStyle}>
                Scroll Speed
                <span className="ml-2 text-xs text-gray-500 font-normal">({bulletinSpeed}s — lower = faster)</span>
              </label>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xs font-semibold text-orange-400 w-10">Fast</span>
                <input type="range" min={5} max={80} step={5} value={bulletinSpeed}
                  onChange={(e) => setBulletinSpeed(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                <span className="text-xs font-semibold text-gray-500 w-10 text-right">Slow</span>
              </div>
              <div className="flex gap-2">
                {[{ label: '⚡ Fast', val: 10 }, { label: '▶ Normal', val: 30 }, { label: '🐢 Slow', val: 60 }].map((p) => (
                  <button key={p.val} type="button" onClick={() => setBulletinSpeed(p.val)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={bulletinSpeed === p.val
                      ? { background: 'linear-gradient(135deg, #e63946, #f77f00)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {bulletinText && bulletinActive && (
              <div>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Preview</p>
                <div className="rounded-xl overflow-hidden py-2 px-4"
                  style={{ background: 'linear-gradient(90deg, #1a1a2e 0%, #302b63 50%, #1a1a2e 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <p className="text-white text-xs font-medium text-center">{bulletinText}</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={bulletinSaving}
              className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-50 w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)', boxShadow: '0 4px 15px rgba(230,57,70,0.3)' }}>
              {bulletinSaving ? 'Saving...' : '💾 Save Bulletin Bar'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

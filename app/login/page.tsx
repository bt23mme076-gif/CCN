'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { portalBg, accentGradient } from '@/components/PortalUI';
import { useOperatorBranding } from '@/lib/useOperatorBranding';

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.14)',
};

export default function LoginPage() {
  const router = useRouter();
  const branding = useOperatorBranding();
  const [step, setStep] = useState<'mobile' | 'pin'>('mobile');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mobile step only validates the number — the PIN step does the real login.
  // (It used to fire a login with a dummy PIN "0000" here, which counted as a
  // failed attempt and silently logged in anyone whose PIN really was 0000.)
  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setStep('pin');
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}$/.test(pin)) {
      setError('Please enter a valid 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, pin }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={portalBg}>
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-10 sm:py-16">
        <div className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #1d1a4a 0%, #15133a 60%, #100e2c 100%)',
            border: '1px solid rgba(245,210,122,0.22)',
            boxShadow: '0 25px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}>
          <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #f5d27a, #e63946, transparent)' }} />
          <div className="absolute -top-24 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(230,57,70,0.22), transparent 70%)' }} />
          <div className="absolute -bottom-24 -left-16 w-60 h-60 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)' }} />

          <div className="relative p-6 sm:p-9">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl blur-md opacity-60" style={{ background: accentGradient }} />
                <Image src={branding.logo_url || '/logo.jpg'} alt={branding.name} width={64} height={64}
                  className="relative h-16 w-16 rounded-2xl object-cover border border-white/20" />
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 text-center">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-gray-400 text-center mb-7">
              {step === 'mobile' ? 'Login to manage your cable connection' : 'Enter your 4-digit PIN to continue'}
            </p>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-7">
              {(['mobile', 'pin'] as const).map((s, i) => (
                <div key={s} className="h-1.5 rounded-full transition-all"
                  style={{
                    width: step === s ? 32 : 12,
                    background: step === s || (s === 'mobile' && step === 'pin') ? accentGradient : 'rgba(255,255,255,0.15)',
                    opacity: i === 0 && step === 'pin' ? 0.5 : 1,
                  }} />
              ))}
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-200 flex items-start gap-2"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                <span className="text-red-400">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {step === 'mobile' ? (
              <form onSubmit={handleMobileSubmit}>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="flex items-stretch rounded-xl overflow-hidden mb-6 focus-within:ring-2 focus-within:ring-[rgba(245,210,122,0.5)]" style={inputStyle}>
                  <span className="flex items-center px-4 text-gray-300 font-semibold border-r border-white/10">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    autoFocus
                    maxLength={10}
                    required
                    className="flex-1 min-w-0 px-4 py-3.5 bg-transparent text-white text-lg font-semibold tracking-wider outline-none placeholder:text-gray-500 placeholder:font-normal placeholder:tracking-normal placeholder:text-base"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5"
                  style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
                  Continue →
                </button>
              </form>
            ) : (
              <form onSubmit={handlePinSubmit}>
                <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-5" style={inputStyle}>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Mobile Number</p>
                    <p className="text-white font-semibold tracking-wider">+91 {mobile}</p>
                  </div>
                  <button type="button"
                    onClick={() => { setStep('mobile'); setPin(''); setError(''); }}
                    className="text-sm font-semibold hover:underline" style={{ color: '#f5d27a' }}>
                    Change
                  </button>
                </div>

                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  maxLength={4}
                  required
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl text-white text-2xl font-bold text-center tracking-[0.6em] outline-none mb-6 placeholder:text-gray-600 focus:ring-2 focus:ring-[rgba(245,210,122,0.5)]"
                  style={inputStyle}
                />

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5"
                  style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
                  {loading ? 'Logging in…' : 'Login'}
                </button>
              </form>
            )}

            <div className="mt-7 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-gray-400 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold hover:underline" style={{ color: '#f5d27a' }}>
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">🔒 Your PIN is never shared. Forgot it? Contact {branding.name}.</p>
      </div>
    </div>
  );
}

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
const inputClass =
  'w-full px-4 py-3 rounded-xl text-white font-medium outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-[rgba(245,210,122,0.5)]';
const labelClass = 'block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider';

// Fields that only ever hold digits — non-digits are stripped as you type.
const NUMERIC_FIELDS = new Set(['mobile', 'pin', 'confirmPin']);

export default function RegisterPage() {
  const router = useRouter();
  const branding = useOperatorBranding();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    stb_number: '',
    area: '',
    pin: '',
    confirmPin: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: NUMERIC_FIELDS.has(name) ? value.replace(/\D/g, '') : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!/^\d{10}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!/^\d{4}$/.test(formData.pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          mobile: formData.mobile,
          stb_number: formData.stb_number,
          area: formData.area,
          pin: formData.pin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pinsMatch = formData.confirmPin.length === 4 && formData.pin === formData.confirmPin;
  const pinsMismatch = formData.confirmPin.length === 4 && formData.pin !== formData.confirmPin;

  return (
    <div className="min-h-screen" style={portalBg}>
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
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
              Create Account
            </h1>
            <p className="text-sm sm:text-base text-gray-400 text-center mb-7">
              Register to start recharging your cable connection
            </p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-200 flex items-start gap-2"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                <span className="text-red-400">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* About you */}
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#f5d27a' }}>Your Details</p>
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" name="name" autoComplete="name" value={formData.name} onChange={handleChange}
                  placeholder="Enter your full name" className={inputClass} style={inputStyle} required />
              </div>

              <div>
                <label className={labelClass}>Mobile Number</label>
                <div className="flex items-stretch rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[rgba(245,210,122,0.5)]" style={inputStyle}>
                  <span className="flex items-center px-4 text-gray-300 font-semibold border-r border-white/10">+91</span>
                  <input type="tel" name="mobile" inputMode="numeric" autoComplete="tel-national"
                    value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} required
                    className="flex-1 min-w-0 px-4 py-3 bg-transparent text-white font-medium tracking-wider outline-none placeholder:text-gray-500 placeholder:tracking-normal" />
                </div>
              </div>

              {/* Connection */}
              <p className="text-xs font-bold uppercase tracking-[0.18em] pt-2" style={{ color: '#f5d27a' }}>Your Connection</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>STB Number</label>
                  <input type="text" name="stb_number" value={formData.stb_number} onChange={handleChange}
                    placeholder="Set-top box number" className={`${inputClass} font-mono`} style={inputStyle} required />
                </div>
                <div>
                  <label className={labelClass}>Area</label>
                  <input type="text" name="area" value={formData.area} onChange={handleChange}
                    placeholder="Area / locality" className={inputClass} style={inputStyle} required />
                </div>
              </div>

              {/* Security */}
              <p className="text-xs font-bold uppercase tracking-[0.18em] pt-2" style={{ color: '#f5d27a' }}>Secure Your Account</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Create PIN</label>
                  <input type="password" name="pin" inputMode="numeric" autoComplete="new-password"
                    value={formData.pin} onChange={handleChange} placeholder="••••" maxLength={4} required
                    className={`${inputClass} text-xl font-bold text-center tracking-[0.5em]`} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Confirm PIN</label>
                  <input type="password" name="confirmPin" inputMode="numeric" autoComplete="new-password"
                    value={formData.confirmPin} onChange={handleChange} placeholder="••••" maxLength={4} required
                    className={`${inputClass} text-xl font-bold text-center tracking-[0.5em]`}
                    style={{
                      ...inputStyle,
                      ...(pinsMatch ? { borderColor: 'rgba(74,222,128,0.6)' } : pinsMismatch ? { borderColor: 'rgba(248,113,113,0.6)' } : {}),
                    }} />
                </div>
              </div>
              {(pinsMatch || pinsMismatch) && (
                <p className={`text-xs font-semibold -mt-1 ${pinsMatch ? 'text-green-400' : 'text-red-300'}`}>
                  {pinsMatch ? '✓ PINs match' : 'PINs do not match'}
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:-translate-y-0.5"
                style={{ background: accentGradient, boxShadow: '0 8px 24px rgba(230,57,70,0.35)' }}>
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <div className="mt-7 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: '#f5d27a' }}>
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">🔒 You will use your mobile number and PIN to log in.</p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'mobile' | 'pin'>('mobile');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{10}$/.test(mobile)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    // Check if customer exists
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, pin: '0000' }), // Dummy PIN to check existence
      });

      // If we get 401, customer exists but PIN is wrong - that's expected
      // If we get other errors, customer might not exist
      setStep('pin');
    } catch {
      setError('Failed to verify mobile number');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gray-1">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="card">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-navy mb-2 text-center">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
            Login to manage your cable connection
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {step === 'mobile' ? (
            <form onSubmit={handleMobileSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="input-field"
                  maxLength={10}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit}>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mobile}
                    disabled
                    className="input-field bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setStep('mobile');
                      setPin('');
                      setError('');
                    }}
                    className="text-accent-blue hover:underline text-sm whitespace-nowrap"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your PIN"
                  className="input-field"
                  maxLength={4}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-accent-blue hover:underline font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

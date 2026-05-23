'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function RegisterPage() {
  const router = useRouter();
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
        router.push('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-1">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-16">
        <div className="card">
          <h1 className="font-display text-3xl font-bold text-brand-navy mb-2 text-center">
            Create Account
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Register to start recharging your cable connection
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="input-field"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="input-field"
                maxLength={10}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                STB Number
              </label>
              <input
                type="text"
                name="stb_number"
                value={formData.stb_number}
                onChange={handleChange}
                placeholder="Your set-top box number"
                className="input-field"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Your area/locality"
                className="input-field"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create 4-Digit PIN
              </label>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleChange}
                placeholder="Enter 4-digit PIN"
                className="input-field"
                maxLength={4}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm PIN
              </label>
              <input
                type="password"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleChange}
                placeholder="Re-enter your PIN"
                className="input-field"
                maxLength={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-accent-blue hover:underline font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

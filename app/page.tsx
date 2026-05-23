'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PlanCard from '@/components/PlanCard';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  channels: string[];
  is_popular: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    // Check if user is authenticated
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        // User is authenticated, go to plans page
        router.push('/plans');
      } else {
        // User not authenticated, go to login
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-brand-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
            Recharge Your Cable Connection Online
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Fast, secure, and hassle-free cable recharge with instant activation.
            Choose your plan and get started in minutes.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-accent-red text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-red-700 transition-colors"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 bg-gray-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-brand-navy mb-4">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 text-lg">
              Select the perfect plan for your entertainment needs
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-red"></div>
            </div>
          ) : plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onSelect={handleSelectPlan} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No plans available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-red bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-brand-navy mb-2">
                Instant Activation
              </h3>
              <p className="text-gray-600">
                Your recharge is activated within minutes by our operators
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-accent-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-brand-navy mb-2">
                Secure Payments
              </h3>
              <p className="text-gray-600">
                All transactions are secured with Razorpay payment gateway
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-brand-navy mb-2">
                Full History
              </h3>
              <p className="text-gray-600">
                Track all your recharges and view detailed transaction history
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

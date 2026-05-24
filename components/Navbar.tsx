'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '@/lib/useTranslation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setCustomerName(data.customer?.name || '');
        } else {
          setIsAuthenticated(false);
          setCustomerName('');
        }
      } catch (error) {
        setIsAuthenticated(false);
        setCustomerName('');
      }
    };
    checkAuth();
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setMobileMenuOpen(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed');
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image 
              src="/logo.jpg" 
              alt="CCN Network"
              width={40} 
              height={40} 
              className="h-10 w-10 rounded-md object-cover" 
            />
            <span className="font-display text-lg sm:text-xl md:text-2xl font-bold text-brand-navy">
              CCN Network
            </span>
          </Link>

          {!isAuthPage && (
            <>
              {/* Desktop Menu */}
              <div className="hidden md:flex gap-3 lg:gap-4 items-center">
                <LanguageSwitcher />
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="px-3 lg:px-4 py-2 text-brand-navy font-medium hover:text-accent-blue transition-colors text-sm lg:text-base"
                    >
                      {t('dashboard')}
                    </Link>
                    <Link
                      href="/dashboard/buy"
                      className="px-3 lg:px-4 py-2 text-brand-navy font-medium hover:text-accent-blue transition-colors text-sm lg:text-base"
                    >
                      Buy & History
                    </Link>
                    {customerName && (
                      <span className="text-gray-600 text-sm lg:text-base hidden lg:inline">
                        Hi, {customerName}
                      </span>
                    )}
                    <button
                      onClick={handleLogout}
                      className="px-3 lg:px-4 py-2 text-accent-red font-medium hover:text-red-700 transition-colors text-sm lg:text-base"
                    >
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-3 lg:px-4 py-2 text-brand-navy font-medium hover:text-accent-red transition-colors text-sm lg:text-base"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      className="btn-primary text-sm lg:text-base px-4 lg:px-6 py-2"
                    >
                      {t('register')}
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg
                  className="w-6 h-6 text-brand-navy"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {!isAuthPage && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fadeIn">
            <div className="flex flex-col space-y-2">
              {/* Language Switcher */}
              <div className="pb-3 border-b border-gray-200 px-2">
                <LanguageSwitcher />
              </div>
              
              {/* User Greeting (Mobile) */}
              {isAuthenticated && customerName && (
                <div className="px-4 py-2 text-gray-600 font-medium border-b border-gray-200">
                  Hi, {customerName}
                </div>
              )}
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-brand-navy font-medium hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {t('dashboard')}
                  </Link>
                  <Link
                    href="/dashboard/buy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-brand-navy font-medium hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Buy & History
                  </Link>
                  <Link
                    href="/plans"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-brand-navy font-medium hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    Browse Plans
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-3 text-accent-red font-medium hover:bg-red-50 rounded-lg transition-colors text-left flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-brand-navy font-medium hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mx-4 btn-primary text-center flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    {t('register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

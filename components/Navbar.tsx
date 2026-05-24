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
  const { t } = useTranslation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
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
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="CCN Cable" width={40} height={40} className="h-10 w-auto rounded-md object-contain" />
            <span className="font-display text-xl sm:text-2xl font-bold text-brand-navy hidden sm:inline-block">CCN Cable</span>
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
                      className="btn-primary text-sm lg:text-base px-4 lg:px-6"
                    >
                      {t('register')}
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
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
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <div className="pb-3 border-b border-gray-200">
                <LanguageSwitcher />
              </div>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-brand-navy font-medium hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-accent-red font-medium hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 text-brand-navy font-medium hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mx-4 btn-primary text-center"
                  >
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

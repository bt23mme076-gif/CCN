'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BulletinBar from './BulletinBar';
import { useTranslation } from '@/lib/useTranslation';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRetrackPopup, setShowRetrackPopup] = useState(false);
  const [retrackStb, setRetrackStb] = useState('');
  const [retrackEdited, setRetrackEdited] = useState(false);
  const [retrackLoading, setRetrackLoading] = useState(false);
  const [retrackDone, setRetrackDone] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      } catch {
        setIsAuthenticated(false);
        setCustomerName('');
      }
    };
    checkAuth();
    setMobileMenuOpen(false);
  }, [pathname]);

  const openRetrack = async () => {
    setShowDropdown(false);
    setRetrackDone(false);
    setRetrackEdited(false);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) { const d = await res.json(); setRetrackStb(d.customer?.stb_number || ''); }
    } catch { setRetrackStb(''); }
    setShowRetrackPopup(true);
  };

  const handleRetrackRequest = async () => {
    if (!retrackStb.trim() && !retrackEdited) return;
    setRetrackLoading(true);
    try {
      await fetch('/api/retrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stb_number: retrackStb.trim() }),
      });
      setRetrackDone(true);
    } catch { /* ignore */ }
    finally { setRetrackLoading(false); }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setMobileMenuOpen(false);
      router.push('/login');
    } catch {
      console.error('Logout failed');
    }
  };

  return (
    <div className={`sticky top-0 z-50 ${scrolled ? 'shadow-2xl' : 'shadow-lg'}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Main navbar */}
      <nav
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #1a1a4e 100%)' }}
      >
        {/* Shimmer line at top */}
        <div className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)' }} />

        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-lg blur-sm opacity-60 group-hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #e94560, #f5a623)' }}
                />
                <Image
                  src="/logo.jpg"
                  alt="CCN Cable"
                  width={40}
                  height={40}
                  className="relative h-10 w-10 rounded-lg object-cover border border-white/20"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg sm:text-xl font-extrabold tracking-wide text-white">
                  CCN Networks
                </span>
              </div>
            </Link>

            {!isAuthPage && (
              <>
                {/* Desktop Menu */}
                <div className="hidden md:flex gap-1 lg:gap-2 items-center">
                  {isAuthenticated ? (
                    <>
                      {customerName && (
                        <span className="text-blue-200 text-sm flex items-center gap-1.5 mr-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse" />
                          Hi, <span className="text-white font-semibold">{customerName}</span>
                        </span>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown((p) => !p)}
                          className="flex flex-col gap-1.5 justify-center items-center w-9 h-9 rounded-lg hover:bg-white/15 transition-colors border border-white/20"
                        >
                          <span className="block w-4 h-0.5 bg-white rounded-full" />
                          <span className="block w-4 h-0.5 bg-white rounded-full" />
                          <span className="block w-4 h-0.5 bg-white rounded-full" />
                        </button>
                        {showDropdown && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                            <div className="absolute right-0 top-11 z-50 w-48 rounded-xl shadow-2xl py-1 overflow-hidden"
                              style={{ background: '#1a1740', border: '1px solid rgba(255,255,255,0.12)' }}>
                              <Link href="/dashboard"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors">
                                <span>🏠</span> Dashboard
                              </Link>
                              <Link href="/dashboard/buy"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors">
                                <span>💳</span> Buy & History
                              </Link>
                              <button
                                onClick={openRetrack}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-colors w-full text-left">
                                <span>📺</span> Request Retrack
                              </button>
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} className="my-1" />
                              <button
                                onClick={() => { setShowDropdown(false); handleLogout(); }}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-white hover:bg-red-500/20 transition-colors w-full text-left">
                                <span>🚪</span> Logout
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                      >
                        {t('login')}
                      </Link>
                      <Link
                        href="/register"
                        className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #e94560, #c0392b)',
                          boxShadow: '0 4px 15px rgba(233, 69, 96, 0.4)',
                        }}
                      >
                        {t('register')}
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                  aria-label="Toggle menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          {!isAuthPage && mobileMenuOpen && (
            <div className="md:hidden pb-4 animate-fadeIn"
              style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex flex-col space-y-1 pt-3">
                {isAuthenticated && customerName && (
                  <div className="px-4 py-2 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-blue-200 text-sm">Hi, <span className="text-white font-semibold">{customerName}</span></span>
                  </div>
                )}
                {isAuthenticated ? (
                  <>
                    <MobileNavLink href="/dashboard" label={t('dashboard')} onClick={() => setMobileMenuOpen(false)}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                    />
                    <MobileNavLink href="/dashboard/buy" label="Buy & History" onClick={() => setMobileMenuOpen(false)}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />}
                    />
                    <MobileNavLink href="/plans" label="Browse Plans" onClick={() => setMobileMenuOpen(false)}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />}
                    />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:text-white hover:bg-red-500/20 transition-all duration-200 text-left mx-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">{t('logout')}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <MobileNavLink href="/login" label={t('login')} onClick={() => setMobileMenuOpen(false)}
                      icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />}
                    />
                    <div className="px-1 pt-1">
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-white font-bold transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg, #e94560, #c0392b)', boxShadow: '0 4px 15px rgba(233, 69, 96, 0.3)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        {t('register')}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Bulletin Bar — below navbar */}
      {!isAuthPage && <BulletinBar />}

      {/* Retrack Popup */}
      {showRetrackPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            {retrackDone ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Keep your STB and TV <span className="font-bold text-green-600">ON</span> for the next 5 minutes.
                </p>
                <button onClick={() => setShowRetrackPopup(false)}
                  className="w-full py-3 rounded-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #1a1a40, #2d2b69)' }}>
                  OK, Got It
                </button>
              </>
            ) : (
              <>
                <div className="text-3xl mb-3">📺</div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-4">Request Retrack</h3>
                <div className="text-left mb-5">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">STB Number</label>
                  <input type="text" inputMode="numeric"
                    value={retrackEdited ? retrackStb : retrackStb}
                    onChange={(e) => { setRetrackEdited(true); setRetrackStb(e.target.value.replace(/\D/g, '')); }}
                    onKeyDown={(e) => { if (!retrackEdited && e.key !== 'Tab' && e.key !== 'Enter') { setRetrackEdited(true); setRetrackStb(''); } }}
                    placeholder="Enter your STB number"
                    className="w-full px-4 py-3 rounded-xl border text-sm font-mono text-gray-800 outline-none transition-colors"
                    style={{ borderColor: retrackEdited ? '#3b82f6' : '#e5e7eb' }} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowRetrackPopup(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleRetrackRequest}
                    disabled={retrackLoading || !retrackStb.trim()}
                    className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #e63946, #c0392b)' }}>
                    {retrackLoading ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive ? 'text-white bg-white/15 border border-white/20' : 'text-blue-200 hover:text-white hover:bg-white/10'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, icon, onClick }: { href: string; label: string; icon: React.ReactNode; onClick: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mx-1 ${
        isActive ? 'text-white bg-white/15 border border-white/20' : 'text-blue-200 hover:text-white hover:bg-white/10'
      }`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

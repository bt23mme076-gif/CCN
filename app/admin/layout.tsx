'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname === '/admin/login') { setLoading(false); return; }
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) setIsAuthenticated(true);
        else router.push('/admin/login');
      } catch { router.push('/admin/login'); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [pathname, router]);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  if (pathname === '/admin/login') return <>{children}</>;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
        <p className="text-white/60 text-sm">Loading admin panel...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/pending', label: 'Pending', icon: '⏳', desc: 'Activations' },
    { href: '/admin/recharges', label: 'Recharges', icon: '💳', desc: 'All orders' },
    { href: '/admin/customers', label: 'Customers', icon: '👥', desc: 'Manage users' },
    { href: '/admin/plans', label: 'Plans', icon: '📋', desc: 'Manage plans' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️', desc: 'Config' },
  ];

  const sidebarBg = 'linear-gradient(180deg, #0f0c29 0%, #1a1040 40%, #0f0c29 100%)';

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0d0d1a 0%, #12102a 50%, #0d0d1a 100%)',
      backgroundImage: `
        linear-gradient(135deg, #0d0d1a 0%, #12102a 50%, #0d0d1a 100%),
        linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 40px 40px, 40px 40px',
    }}>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 shadow-2xl"
        style={{ background: sidebarBg, borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="font-display text-lg font-bold text-white">CCN Admin</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t animate-fadeIn" style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
            <nav className="py-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 transition-all ${
                    pathname === item.href
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={pathname === item.href ? {
                    background: 'linear-gradient(90deg, rgba(230,57,70,0.2), transparent)',
                    borderLeft: '3px solid #e63946'
                  } : {}}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              <button onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:text-red-400 hover:bg-white/5 transition-all">
                <span className="text-xl">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 fixed h-full"
          style={{ background: sidebarBg, borderRight: '1px solid rgba(99,102,241,0.15)' }}>

          {/* Logo */}
          <div className="p-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #e63946, #f77f00)' }}>
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-white leading-tight">CCN Admin</h1>
                <p className="text-[10px] text-purple-400 uppercase tracking-widest">Control Panel</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(230,57,70,0.25), rgba(247,127,0,0.15))',
                    border: '1px solid rgba(230,57,70,0.3)',
                  } : {}}>
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group">
              <span className="text-xl">🚪</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full lg:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

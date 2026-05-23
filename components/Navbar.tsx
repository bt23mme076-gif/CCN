'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-display text-2xl font-bold text-brand-navy">
            CableEasy
          </Link>

          {!isAuthPage && (
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-brand-navy font-medium hover:text-accent-red transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-primary"
              >
                Recharge Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

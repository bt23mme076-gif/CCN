'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/pending', label: 'Pending Activations', icon: '⏳' },
    { href: '/admin/recharges', label: 'All Recharges', icon: '💳' },
    { href: '/admin/customers', label: 'Customers', icon: '👥' },
    { href: '/admin/plans', label: 'Plans', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-1 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-brand-navy text-white fixed h-full">
        <div className="p-6">
          <h1 className="font-display text-2xl font-bold mb-8">CableEasy</h1>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? 'bg-accent-red text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 w-56 p-6">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="mr-2">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 p-8">{children}</main>
    </div>
  );
}

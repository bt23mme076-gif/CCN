'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === '/superadmin/login') { setReady(true); return; }
    fetch('/api/superadmin/operators')
      .then(r => { if (!r.ok) router.push('/superadmin/login'); else setReady(true); })
      .catch(() => router.push('/superadmin/login'));
  }, [pathname, router]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#0f0c29' }}>
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return <>{children}</>;
}

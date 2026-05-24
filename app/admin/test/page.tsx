'use client';

import { useEffect, useState } from 'react';

export default function AdminTestPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if we have a cookie
      const cookies = document.cookie;
      console.log('Cookies:', cookies);

      // Try to fetch admin stats (requires auth)
      const response = await fetch('/api/admin/stats');
      const data = await response.json();

      setAuthStatus({
        status: response.status,
        ok: response.ok,
        data: data,
        cookies: cookies,
      });
    } catch (error) {
      setAuthStatus({
        error: String(error),
        cookies: document.cookie,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Auth Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <pre>{JSON.stringify(authStatus, null, 2)}</pre>
      </div>
      <div className="mt-4">
        <button
          onClick={checkAuth}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

interface RetrackRequest {
  id: string;
  customer_name: string;
  stb_number: string;
  mobile: string;
  status: string;
  created_at: string;
}

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

export default function RetrackPage() {
  const [requests, setRequests] = useState<RetrackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await (await fetch('/api/admin/retrack')).json();
      setRequests(data.requests || []);
    } catch { setRequests([]); }
    finally { setLoading(false); }
  };

  const handleMarkDone = async (id: string) => {
    setMarking(id);
    try {
      await fetch('/api/admin/retrack', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'done' } : r));
    } catch { /* ignore */ }
    finally { setMarking(null); }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const done = requests.filter((r) => r.status === 'done');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">STB Retrack Requests</h1>
        <p className="text-sm text-gray-400 mt-0.5">Customer requests to retrack their STB on NXT Digital portal</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          {/* Pending */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-base font-bold text-white">Pending</h2>
              {pending.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(230,57,70,0.2)', color: '#f87171' }}>
                  {pending.length}
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center rounded-xl" style={cardStyle}>
                No pending retrack requests
              </p>
            ) : (
              <div className="rounded-2xl overflow-hidden" style={cardStyle}>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  {pending.map((req) => (
                    <div key={req.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                        style={{ background: 'rgba(230,57,70,0.15)' }}>
                        📺
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm">{req.customer_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          STB: <span className="text-gray-300">{req.stb_number}</span>
                          <span className="mx-2 text-gray-600">·</span>
                          {req.mobile}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(req.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleMarkDone(req.id)}
                        disabled={marking === req.id}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                        {marking === req.id ? '...' : 'Mark Done'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Done */}
          {done.length > 0 && (
            <div>
              <h2 className="font-display text-base font-bold text-gray-400 mb-3">Completed</h2>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {done.map((req) => (
                    <div key={req.id} className="flex items-center gap-4 px-5 py-3 opacity-50">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ background: 'rgba(34,197,94,0.1)' }}>
                        ✅
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-300 text-sm">{req.customer_name}</p>
                        <p className="text-xs text-gray-500">STB: {req.stb_number} · {req.mobile}</p>
                      </div>
                      <span className="text-xs text-green-500 font-medium flex-shrink-0">Done</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

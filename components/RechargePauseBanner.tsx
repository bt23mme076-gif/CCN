'use client';

import { useEffect, useState } from 'react';
import { msoForStb } from '@/lib/mso';

interface PausedMso { id: string; name: string; message: string }

// Customer-facing notice when the admin has paused recharges for an MSO.
// With an STB number it only shows that STB's MSO; without one (e.g. the
// public home page) it lists every paused MSO.
export default function RechargePauseBanner({ stbNumber, className = '' }: { stbNumber?: string | null; className?: string }) {
  const [paused, setPaused] = useState<PausedMso[]>([]);

  useEffect(() => {
    fetch('/api/recharge-pause', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setPaused(d.paused || []))
      .catch(() => {});
  }, []);

  const relevant = stbNumber ? paused.filter((p) => p.id === msoForStb(stbNumber)) : paused;
  if (relevant.length === 0) return null;

  return (
    <div className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(127,29,29,0.22))', border: '1px solid rgba(248,113,113,0.4)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: 'rgba(248,113,113,0.2)' }}>⛔</div>
      <div className="space-y-2">
        {relevant.map((p) => (
          <div key={p.id}>
            <p className="text-xs uppercase tracking-wider font-bold text-red-300">{p.name} recharges paused</p>
            <p className="text-sm text-red-100/90">{p.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

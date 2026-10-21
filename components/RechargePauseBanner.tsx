'use client';

import { useEffect, useState } from 'react';
import { msoForStb } from '@/lib/mso';

interface PausedMso { id: string; name: string; message: string }

// Customer-facing notice when the admin has paused recharges for an MSO.
// With an STB number it only shows that STB's MSO; without one (e.g. the
// public home page) it lists every paused MSO.
export default function RechargePauseBanner({ stbNumber, className = '', wrapperClassName }: { stbNumber?: string | null; className?: string; wrapperClassName?: string }) {
  const [paused, setPaused] = useState<PausedMso[]>([]);

  useEffect(() => {
    fetch('/api/recharge-pause', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setPaused(d.paused || []))
      .catch(() => {});
  }, []);

  const relevant = stbNumber ? paused.filter((p) => p.id === msoForStb(stbNumber)) : paused;
  if (relevant.length === 0) return null;

  const banner = (
    <div className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3 ${className}`}
      style={{ background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 55%, #450a0a 100%)', border: '1px solid #f87171', boxShadow: '0 10px 30px rgba(127,29,29,0.35)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>⛔</div>
      <div className="space-y-2">
        {relevant.map((p) => (
          <div key={p.id}>
            <p className="text-xs uppercase tracking-wider font-extrabold text-white">{p.name} recharges paused</p>
            <p className="text-sm text-red-50">{p.message}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // wrapperClassName: an outer strip (e.g. a dark band on the home page) that
  // only renders when the banner does, so it never leaves an empty gap.
  return wrapperClassName ? <div className={wrapperClassName}>{banner}</div> : banner;
}

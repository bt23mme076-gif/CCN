'use client';

import { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  text: string;
  is_active: boolean;
}

export default function BulletinBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/announcement', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.announcement) setAnnouncement(data.announcement);
      })
      .catch(() => {});
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, #1a1a2e 0%, #e63946 35%, #f77f00 65%, #1a1a2e 100%)',
        backgroundSize: '200% 100%',
        animation: 'bulletinShift 8s ease-in-out infinite',
      }}
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
          animation: 'bulletinShimmer 3s linear infinite',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2.5">
          {/* Left badge */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <span
              className="hidden sm:flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/20"
            >
              <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
              Notice
            </span>
            {/* Mobile: just icon */}
            <span className="sm:hidden text-yellow-300 text-base">📢</span>
          </div>

          {/* Scrolling text */}
          <div className="flex-1 overflow-hidden">
            <p className="text-white text-xs sm:text-sm font-medium text-center leading-relaxed px-2">
              {announcement.text}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1 rounded"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

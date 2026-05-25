'use client';

import { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  text: string;
  is_active: boolean;
}

export default function BulletinBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch('/api/announcement', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.announcement) setAnnouncement(data.announcement);
      })
      .catch(() => {});
  }, []);

  if (!announcement) return null;

  // Repeat text several times so the scroll looks seamless
  const repeated = Array(6).fill(announcement.text).join('   •   ');

  return (
    <div
      className="w-full overflow-hidden py-2"
      style={{
        background: 'linear-gradient(90deg, #1a1a2e 0%, #302b63 50%, #1a1a2e 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="whitespace-nowrap text-sm font-medium text-white/90 inline-block"
        style={{
          animation: 'tickerScroll 30s linear infinite',
          paddingLeft: '100%',
        }}
      >
        {repeated}
      </div>

      <style jsx>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

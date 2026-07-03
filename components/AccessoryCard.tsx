'use client';

import { formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';

interface Accessory {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface AccessoryCardProps {
  item: Accessory;
  onSelect: (id: string) => void;
}

export default function AccessoryCard({ item, onSelect }: AccessoryCardProps) {
  const { t } = useTranslation();

  const isRemote = item.id.includes('remote');
  const isCable = item.id.includes('cable');

  // Theme mapping based on item type — bold, saturated gradients instead of faint tints
  const theme = isRemote
    ? {
        headerGradient: 'linear-gradient(135deg, #a855f7 0%, #d946ef 50%, #ec4899 100%)',
        glowShadow: 'hover:shadow-[0_20px_45px_-10px_rgba(168,85,247,0.45)]',
        ring: 'ring-1 ring-purple-200/60 hover:ring-purple-400/80',
        badgeText: 'Genuine Remote',
        btnGradient: 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 hover:shadow-purple-500/40',
        priceColor: 'text-purple-600',
        bulletColor: 'bg-purple-500',
        chipBg: 'bg-purple-50 text-purple-700',
        blobColor: 'rgba(217,70,239,0.25)',
      }
    : isCable
    ? {
        headerGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)',
        glowShadow: 'hover:shadow-[0_20px_45px_-10px_rgba(6,182,212,0.45)]',
        ring: 'ring-1 ring-cyan-200/60 hover:ring-cyan-400/80',
        badgeText: 'High Speed',
        btnGradient: 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:shadow-cyan-500/40',
        priceColor: 'text-cyan-600',
        bulletColor: 'bg-cyan-500',
        chipBg: 'bg-cyan-50 text-cyan-700',
        blobColor: 'rgba(59,130,246,0.25)',
      }
    : {
        headerGradient: 'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #eab308 100%)',
        glowShadow: 'hover:shadow-[0_20px_45px_-10px_rgba(245,158,11,0.45)]',
        ring: 'ring-1 ring-orange-200/60 hover:ring-orange-400/80',
        badgeText: 'Stable Power',
        btnGradient: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:shadow-orange-500/40',
        priceColor: 'text-orange-600',
        bulletColor: 'bg-orange-500',
        chipBg: 'bg-orange-50 text-orange-700',
        blobColor: 'rgba(249,115,22,0.25)',
      };

  return (
    <div
      className={`group relative rounded-3xl bg-white ${theme.ring} ${theme.glowShadow} flex flex-col justify-between transition-all duration-500 hover:-translate-y-2.5 overflow-hidden shadow-lg`}
    >
      {/* Colorful header band */}
      <div
        className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-14 overflow-hidden"
        style={{ background: theme.headerGradient }}
      >
        {/* Decorative blobs */}
        <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/20 blur-xl group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute left-1/3 -bottom-10 w-28 h-28 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex justify-between items-start">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/25 backdrop-blur-sm text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg border border-white/30">
            {isRemote ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h6M9 10h6M12 14h.01" />
              </svg>
            ) : isCable ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/90 text-gray-900 shadow-sm tracking-wide backdrop-blur-sm">
            {theme.badgeText}
          </span>
        </div>

        <h3 className="relative font-display text-xl sm:text-2xl font-black text-white mt-5 drop-shadow-sm">
          {item.name}
        </h3>
      </div>

      {/* Body — overlaps header slightly with a rounded white card */}
      <div className="relative -mt-8 mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-2xl bg-white p-5 sm:p-6 shadow-md flex-1 flex flex-col">
        <p className="text-gray-500 text-sm mb-5 leading-relaxed font-medium">
          {item.description}
        </p>

        {/* Feature bullets */}
        <ul className="space-y-2 mb-5">
          <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${theme.bulletColor}`} />
            Doorstep operator delivery
          </li>
          <li className="flex items-center gap-2 text-xs text-gray-600 font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${theme.bulletColor}`} />
            Tested and certified genuine
          </li>
        </ul>

        {/* Pricing & CTA */}
        <div className="mt-auto border-t border-gray-100 pt-4">
          <div className="flex justify-between items-baseline mb-4">
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${theme.chipBg}`}>Price</span>
            <span className={`text-3xl font-extrabold tracking-tight ${theme.priceColor}`}>
              {formatCurrency(item.price)}
            </span>
          </div>
          <button
            onClick={() => onSelect(item.id)}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-sm transition-all duration-300 shadow-md ${theme.btnGradient} hover:shadow-xl hover:-translate-y-0.5 active:scale-95`}
          >
            {t('orderNow')}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // Theme mapping based on item type
  const theme = isRemote
    ? {
        cardBg: 'bg-gradient-to-br from-purple-500/5 via-fuchsia-500/5 to-white hover:from-purple-500/10 hover:via-fuchsia-500/10',
        border: 'border border-purple-100 hover:border-purple-300',
        glowShadow: 'hover:shadow-[0_10px_35px_rgba(168,85,247,0.18)]',
        iconBg: 'bg-purple-100/80 text-purple-600 group-hover:scale-110 group-hover:rotate-6',
        badgeText: 'Genuine Remote',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
        btnGradient: 'bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 hover:shadow-purple-500/25',
        priceColor: 'text-purple-600',
        bulletColor: 'bg-purple-500',
      }
    : isCable
    ? {
        cardBg: 'bg-gradient-to-br from-cyan-500/5 via-sky-500/5 to-white hover:from-cyan-500/10 hover:via-sky-500/10',
        border: 'border border-cyan-100 hover:border-cyan-300',
        glowShadow: 'hover:shadow-[0_10px_35px_rgba(6,182,212,0.18)]',
        iconBg: 'bg-cyan-100/80 text-cyan-600 group-hover:scale-110 group-hover:-rotate-3',
        badgeText: 'High Speed',
        badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-100',
        btnGradient: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 hover:shadow-cyan-500/25',
        priceColor: 'text-cyan-600',
        bulletColor: 'bg-cyan-500',
      }
    : {
        cardBg: 'bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-white hover:from-orange-500/10 hover:via-amber-500/10',
        border: 'border border-orange-100 hover:border-orange-300',
        glowShadow: 'hover:shadow-[0_10px_35px_rgba(245,158,11,0.18)]',
        iconBg: 'bg-orange-100/80 text-orange-600 group-hover:scale-110 group-hover:translate-y-[-2px]',
        badgeText: 'Stable Power',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-100',
        btnGradient: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/25',
        priceColor: 'text-orange-600',
        bulletColor: 'bg-orange-500',
      };

  return (
    <div
      className={`group relative rounded-3xl p-6 sm:p-8 ${theme.cardBg} ${theme.border} ${theme.glowShadow} flex flex-col justify-between transition-all duration-500 hover:-translate-y-2.5 overflow-hidden`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Glow decorative background elements */}
      <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-[0.05] blur-2xl group-hover:opacity-[0.12] transition-opacity duration-500" style={{ background: 'currentColor' }} />

      <div>
        {/* Top bar with Badge */}
        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme.iconBg} transition-all duration-300 shadow-sm`}>
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
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${theme.badgeBg} shadow-sm tracking-wide`}>
            {theme.badgeText}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="font-display text-xl sm:text-2xl font-black text-brand-navy mb-3 group-hover:text-black transition-colors duration-300">
          {item.name}
        </h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed font-medium">
          {item.description}
        </p>

        {/* Feature bullets */}
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full ${theme.bulletColor}`} />
            Doorstep operator delivery
          </li>
          <li className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`w-1.5 h-1.5 rounded-full ${theme.bulletColor}`} />
            Tested and certified genuine
          </li>
        </ul>
      </div>

      {/* Pricing & CTA */}
      <div className="border-t border-gray-50 pt-5">
        <div className="flex justify-between items-baseline mb-5">
          <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Price</span>
          <span className={`text-3xl font-extrabold tracking-tight ${theme.priceColor}`}>
            {formatCurrency(item.price)}
          </span>
        </div>
        <button
          onClick={() => onSelect(item.id)}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-sm transition-all duration-300 shadow-md ${theme.btnGradient} hover:-translate-y-0.5 active:scale-95`}
        >
          {t('orderNow')}
        </button>
      </div>
    </div>
  );
}

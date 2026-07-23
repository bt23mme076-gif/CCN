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

  const theme = isRemote
    ? {
        gradient: 'from-purple-500 to-purple-700',
        badge: 'Genuine Remote',
        badgeBg: 'bg-white/20 text-white',
        btnBg: 'bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800',
        price: 'text-purple-600',
        accent: 'border-purple-500',
        glow: 'hover:shadow-purple-100',
      }
    : isCable
    ? {
        gradient: 'from-blue-500 to-blue-700',
        badge: 'High Speed',
        badgeBg: 'bg-white/20 text-white',
        btnBg: 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800',
        price: 'text-blue-600',
        accent: 'border-blue-500',
        glow: 'hover:shadow-blue-100',
      }
    : {
        gradient: 'from-orange-400 to-orange-600',
        badge: 'Stable Power',
        badgeBg: 'bg-white/20 text-white',
        btnBg: 'bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700',
        price: 'text-orange-500',
        accent: 'border-orange-400',
        glow: 'hover:shadow-orange-100',
      };

  return (
    <div className={`bg-white rounded-2xl border-t-4 ${theme.accent} shadow-md hover:shadow-xl ${theme.glow} transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden`}>
      {/* Product Image Area */}
      <div className={`relative flex items-center justify-center bg-gradient-to-br ${theme.gradient}`} style={{ height: 170 }}>
        <span className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm ${theme.badgeBg} border border-white/30`}>
          {theme.badge}
        </span>
        <img
          src={isRemote ? '/remote.png' : isCable ? '/hdmi.png' : '/adapter.png'}
          alt={item.name}
          className={`drop-shadow-xl ${isRemote ? 'object-cover h-full w-auto max-w-[45%]' : 'object-contain w-full h-full p-5'}`}
        />
      </div>

      {/* Body */}
      <div className="px-5 pt-4 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-3">{item.description}</p>

        <ul className="space-y-1.5 mb-4">
          {['Doorstep delivery by operator', 'Genuine & tested product'].map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">Price</span>
            <span className={`text-2xl font-extrabold ${theme.price}`}>{formatCurrency(item.price)}</span>
          </div>
          <button
            onClick={() => onSelect(item.id)}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm shadow-md transition-all duration-200 active:scale-95 ${theme.btnBg}`}
          >
            {t('orderNow')}
          </button>
        </div>
      </div>
      <div className="h-4" />
    </div>
  );
}

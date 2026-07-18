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
    ? { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', badge: 'Genuine Remote', badgeBg: 'bg-purple-50 text-purple-700', btnBg: 'bg-purple-600 hover:bg-purple-700', price: 'text-purple-600' }
    : isCable
    ? { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', badge: 'High Speed', badgeBg: 'bg-blue-50 text-blue-700', btnBg: 'bg-blue-600 hover:bg-blue-700', price: 'text-blue-600' }
    : { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', badge: 'Stable Power', badgeBg: 'bg-orange-50 text-orange-700', btnBg: 'bg-orange-500 hover:bg-orange-600', price: 'text-orange-600' };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
      {/* Header */}
      <div className="p-6 pb-4 flex items-start justify-between gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.iconBg}`}>
          {isRemote ? (
            <svg className={`w-6 h-6 ${theme.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2zM9 6h6M9 10h6" />
            </svg>
          ) : isCable ? (
            <svg className={`w-6 h-6 ${theme.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className={`w-6 h-6 ${theme.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.badgeBg}`}>{theme.badge}</span>
      </div>

      {/* Body */}
      <div className="px-6 flex-1 flex flex-col">
        <h3 className="font-display text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.description}</p>

        <ul className="space-y-1.5 mb-5">
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
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</span>
            <span className={`text-2xl font-extrabold ${theme.price}`}>{formatCurrency(item.price)}</span>
          </div>
          <button
            onClick={() => onSelect(item.id)}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 active:scale-95 ${theme.btnBg}`}
          >
            {t('orderNow')}
          </button>
        </div>
      </div>
      <div className="h-5" />
    </div>
  );
}

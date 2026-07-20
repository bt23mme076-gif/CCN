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
      {/* Product Image Area */}
      <div className={`relative rounded-t-2xl overflow-hidden flex items-center justify-center ${theme.iconBg}`} style={{ height: 160 }}>
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${theme.badgeBg}`}>{theme.badge}</span>
        <img
          src={isRemote ? '/remote.png' : isCable ? '/hdmi.png' : '/adapter.png'}
          alt={item.name}
          className={`object-contain w-full h-full ${isRemote ? 'p-1' : 'p-4'}`}
        />
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

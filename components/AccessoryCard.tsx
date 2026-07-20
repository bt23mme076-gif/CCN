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
        {isRemote ? (
          <svg viewBox="0 0 120 160" width="90" height="120" xmlns="http://www.w3.org/2000/svg">
            <rect x="35" y="10" width="50" height="140" rx="18" fill="#2d2d2d"/>
            <rect x="40" y="15" width="40" height="130" rx="15" fill="#3a3a3a"/>
            <rect x="45" y="22" width="30" height="18" rx="5" fill="#1a1a1a"/>
            <circle cx="60" cy="55" r="10" fill="#e63946"/>
            <circle cx="45" cy="75" r="7" fill="#555"/>
            <circle cx="75" cy="75" r="7" fill="#555"/>
            <circle cx="60" cy="75" r="7" fill="#555"/>
            <circle cx="45" cy="92" r="7" fill="#555"/>
            <circle cx="75" cy="92" r="7" fill="#555"/>
            <circle cx="60" cy="92" r="7" fill="#555"/>
            <circle cx="45" cy="109" r="7" fill="#555"/>
            <circle cx="75" cy="109" r="7" fill="#555"/>
            <circle cx="60" cy="109" r="7" fill="#666"/>
            <rect x="52" y="125" width="16" height="6" rx="3" fill="#444"/>
          </svg>
        ) : isCable ? (
          <svg viewBox="0 0 200 120" width="180" height="110" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="45" width="28" height="30" rx="4" fill="#1a1a1a"/>
            <rect x="10" y="50" width="18" height="20" rx="2" fill="#333"/>
            <rect x="13" y="53" width="3" height="14" rx="1" fill="#aaa" stroke="#888" strokeWidth="0.5"/>
            <rect x="18" y="53" width="3" height="14" rx="1" fill="#aaa"/>
            <rect x="23" y="53" width="3" height="14" rx="1" fill="#aaa"/>
            <rect x="33" y="56" width="8" height="8" rx="2" fill="#222"/>
            <path d="M41 60 Q80 40 100 60 Q120 80 160 60" stroke="#111" strokeWidth="10" fill="none" strokeLinecap="round"/>
            <path d="M41 60 Q80 40 100 60 Q120 80 160 60" stroke="#e63946" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <rect x="159" y="45" width="28" height="30" rx="4" fill="#1a1a1a"/>
            <rect x="164" y="50" width="18" height="20" rx="2" fill="#333"/>
            <rect x="167" y="53" width="3" height="14" rx="1" fill="#aaa"/>
            <rect x="172" y="53" width="3" height="14" rx="1" fill="#aaa"/>
            <rect x="177" y="53" width="3" height="14" rx="1" fill="#aaa"/>
            <rect x="151" y="56" width="8" height="8" rx="2" fill="#222"/>
            <text x="100" y="115" textAnchor="middle" fontSize="11" fill="#666" fontFamily="Arial">HDMI 1m — 1080p</text>
          </svg>
        ) : (
          <svg viewBox="0 0 140 140" width="110" height="110" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="20" width="80" height="60" rx="10" fill="#2d2d2d"/>
            <rect x="35" y="25" width="70" height="50" rx="8" fill="#1a1a1a"/>
            <circle cx="70" cy="50" r="15" fill="#333" stroke="#555" strokeWidth="2"/>
            <circle cx="70" cy="50" r="8" fill="#f5a623"/>
            <circle cx="70" cy="50" r="4" fill="#e08800"/>
            <rect x="55" y="80" width="30" height="8" rx="3" fill="#222"/>
            <rect x="63" y="88" width="14" height="20" rx="3" fill="#333"/>
            <rect x="58" y="105" width="8" height="14" rx="3" fill="#1a1a1a" transform="rotate(-20 62 112)"/>
            <rect x="74" y="105" width="8" height="14" rx="3" fill="#1a1a1a" transform="rotate(20 78 112)"/>
            <circle cx="57" cy="112" r="4" fill="#555"/>
            <circle cx="83" cy="112" r="4" fill="#555"/>
            <text x="70" y="135" textAnchor="middle" fontSize="10" fill="#666" fontFamily="Arial">12V DC Adapter</text>
          </svg>
        )}
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

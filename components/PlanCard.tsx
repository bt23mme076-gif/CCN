'use client';

import { formatCurrency } from '@/lib/utils';
import ChannelListDownload from './ChannelListDownload';
import { useTranslation } from '@/lib/useTranslation';

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    duration_days: number;
    channels: string[];
    is_popular: boolean;
  };
  onSelect: (planId: string) => void;
}

export default function PlanCard({ plan, onSelect }: PlanCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden ${
        plan.is_popular ? 'ring-2 ring-accent-red' : 'border border-gray-100'
      }`}
    >
      {plan.is_popular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-accent-red to-red-500 text-white text-center py-1.5 text-sm font-semibold">
          {t('popularPlan')}
        </div>
      )}

      <div className={`p-6 sm:p-8 ${plan.is_popular ? 'pt-10' : ''}`}>
        <div className="text-center mb-6">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-navy mb-3">
            {plan.name}
          </h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl sm:text-4xl font-bold text-brand-navy">
              {formatCurrency(plan.price)}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            for {plan.duration_days} {t('days')}
          </p>
        </div>

        <div className="mb-4">
          <ChannelListDownload planName={plan.name} price={plan.price} />
        </div>

        <div className="border-t border-gray-100 pt-5 mb-6">
          <ul className="space-y-3">
            {plan.channels.map((channel, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-gray-600 text-sm sm:text-base">{channel}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => onSelect(plan.id)}
          className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 ${
            plan.is_popular
              ? 'bg-accent-red text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25'
              : 'bg-brand-navy text-white hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/25'
          }`}
        >
          {t('selectPlan')}
        </button>
      </div>
    </div>
  );
}

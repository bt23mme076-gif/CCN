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
      className={`card relative ${
        plan.is_popular ? 'ring-2 ring-accent-red' : ''
      }`}
    >
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-red text-white px-4 py-1 rounded-full text-sm font-medium">
          {t('popularPlan')}
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="font-display text-2xl font-bold text-brand-navy mb-2">
          {plan.name}
        </h3>
        <div className="text-4xl font-bold text-accent-red mb-1">
          {formatCurrency(plan.price)}
        </div>
        <p className="text-gray-600">{plan.duration_days} {t('days')}</p>
      </div>

      <div className="mb-4">
        <ChannelListDownload planName={plan.name} price={plan.price} />
      </div>

      <ul className="space-y-3 mb-6">
        {plan.channels.map((channel, index) => (
          <li key={index} className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-success flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-700">{channel}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          plan.is_popular
            ? 'bg-accent-red text-white hover:bg-red-700'
            : 'bg-brand-navy text-white hover:bg-gray-800'
        }`}
      >
        {t('selectPlan')}
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { formatCurrency } from '@/lib/utils';
import { DURATION_OPTIONS, calcDurationPricing } from '@/lib/planDuration';
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
    isCustomPrice?: boolean;
  };
  onSelect: (planId: string, months: number) => void;
  index?: number;
  discounts?: Record<number, number>; // customer-specific, admin controlled — e.g. { 3: 5, 6: 10, 12: 15 }
}

export default function PlanCard({ plan, onSelect, index, discounts = {} }: PlanCardProps) {
  const { t } = useTranslation();
  const [months, setMonths] = useState(1);
  const currentDiscountPercent = discounts[months] || 0;
  const { price: displayPrice, durationDays: displayDurationDays } = calcDurationPricing(
    plan.price,
    plan.duration_days,
    months,
    currentDiscountPercent
  );

  const renderDurationSelector = (variant: 'popular' | 'standard') => (
    <div className="mt-4 flex justify-center gap-1.5">
      {DURATION_OPTIONS.map((opt) => {
        const active = months === opt.months;
        const activeClass = variant === 'popular'
          ? 'bg-black text-white shadow-md scale-105'
          : 'bg-pink-500 text-[#111] shadow-md scale-105';
        const inactiveClass = variant === 'popular'
          ? 'bg-black/10 text-black/60 hover:bg-black/15'
          : 'bg-white/10 text-white/60 hover:bg-white/15';
        const optDiscount = discounts[opt.months] || 0;
        const showDiscount = opt.months > 1 && optDiscount > 0;
        return (
          <button
            key={opt.months}
            type="button"
            onClick={(e) => { e.stopPropagation(); setMonths(opt.months); }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${active ? activeClass : inactiveClass}`}
          >
            {opt.label}{showDiscount ? ` -${optDiscount}%` : ''}
          </button>
        );
      })}
    </div>
  );

  // Determine styling role based on index or popular state
  const isPopular = plan.is_popular || index === 1;
  const isLeft = index === 0;
  const isRight = index === 2;

  // Set rotation angle
  const rotationAngle = isLeft ? -6 : isRight ? 6 : 0;

  if (isPopular) {
    return (
      <div className="relative pt-6 pb-4 w-full max-w-sm flex justify-center z-20">
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95, rotate: 0 }}
          animate={{ opacity: 1, y: -16, scale: 1.1, rotate: 0 }}
          whileHover={{ scale: 1.12, y: -20, transition: { duration: 0.2 } }}
          transition={{ type: 'spring', duration: 0.7, bounce: 0.3 }}
          className="relative w-full rounded-3xl border-4 border-pink-400 bg-gradient-to-b from-[#ff6fb1] to-[#ff3a95] px-6 py-10 sm:px-8 sm:py-12 text-[#1a1a1a] shadow-[0_20px_50px_rgba(255,111,177,0.35)]"
        >
          {/* Best Deal Floating Badge */}
          <motion.div
            animate={{ y: [4, -4, 4] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border border-black/20 bg-[#ff6fb1] px-5 py-1.5 text-xs font-black text-[#1a1a1a] shadow-md uppercase tracking-wider whitespace-nowrap"
          >
            {t('popularPlan')}
          </motion.div>

          {plan.isCustomPrice && (
            <div className="absolute top-4 right-4 bg-black/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              Custom Price
            </div>
          )}

          <div className="text-center mb-6 pt-2">
            <div className="mb-2 text-lg font-black uppercase tracking-wider text-black/80">{plan.name}</div>
            <div className="mb-1 text-5xl font-black text-black">
              {formatCurrency(displayPrice)}
            </div>
            <div className="text-black/70 text-sm font-bold mt-1">
              for {displayDurationDays} {t('days')}
            </div>
          </div>

          {/* Channel list download */}
          <div className="mb-5 bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-black/10 flex justify-center">
            <ChannelListDownload 
              planName={plan.name} 
              price={plan.price} 
              className="text-[#1a1a1a] hover:text-black hover:scale-105" 
            />
          </div>

          <ul className="mb-8 space-y-3 text-sm sm:text-base border-t border-black/10 pt-5">
            {plan.channels.map((channel, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="text-indigo-800 font-extrabold flex-shrink-0 mt-0.5 text-base">✔</span>
                <span className="font-bold text-black/90">{channel}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => onSelect(plan.id, months)}
            className="w-full rounded-xl bg-neutral-900 py-3.5 font-black text-white hover:bg-neutral-800 transition shadow-lg hover:shadow-black/25 active:scale-95 text-center"
          >
            {t('selectPlan')}
          </button>

          {renderDurationSelector('popular')}
        </motion.div>
      </div>
    );
  }

  // Render Left/Right or standard rotated glassmorphic card
  return (
    <div className="relative py-4 w-full max-w-sm flex justify-center z-10">
      <motion.div
        initial={{ opacity: 0, y: 40, rotate: rotationAngle, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, rotate: rotationAngle, scale: 1 }}
        whileHover={{ rotate: 0, scale: 1.05, y: -10, zIndex: 30, transition: { duration: 0.2 } }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="relative w-full rounded-3xl border border-pink-400/30 bg-black/90 hover:bg-black/95 px-6 py-9 sm:px-8 sm:py-10 text-white shadow-[0_0_0_1px_rgba(255,105,180,.08)_inset,0_15px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300"
      >
        {plan.isCustomPrice && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-500/90 to-orange-500/90 text-white text-center py-1.5 text-[10px] font-black uppercase tracking-wider rounded-t-3xl">
            ✓ Special Custom Price
          </div>
        )}

        <div className="text-center mb-6">
          <div className="mb-2 text-lg font-bold text-pink-400 tracking-wider uppercase">{plan.name}</div>
          <div className="mb-1 text-3xl sm:text-4xl font-extrabold text-white">
            {formatCurrency(displayPrice)}
          </div>
          <div className="text-white/60 text-xs sm:text-sm">
            for {displayDurationDays} {t('days')}
          </div>
        </div>

        {/* Channel list download */}
        <div className="mb-5 bg-white/5 p-2.5 rounded-xl border border-white/10 flex justify-center">
          <ChannelListDownload 
            planName={plan.name} 
            price={plan.price} 
            className="text-pink-400 hover:text-pink-300 hover:scale-105" 
          />
        </div>

        <ul className="mb-8 space-y-2.5 text-xs sm:text-sm text-white/80 border-t border-white/10 pt-5">
          {plan.channels.map((channel, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <span className="text-indigo-400 font-extrabold flex-shrink-0 mt-0.5">✔</span>
              <span className="text-white/95">{channel}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelect(plan.id, months)}
          className="w-full rounded-xl bg-pink-500 py-3.5 font-bold text-[#111] hover:bg-pink-400 transition shadow-md hover:shadow-pink-500/25 active:scale-95 text-center"
        >
          {t('selectPlan')}
        </button>

        {renderDurationSelector('standard')}
      </motion.div>
    </div>
  );
}

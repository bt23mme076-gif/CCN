// Shared building blocks for the dark "premium" customer portal pages
// (dashboard + buy/history), so both pages look like one product.

import type { CSSProperties, ReactNode } from 'react';

export const portalBg: CSSProperties = {
  background:
    'radial-gradient(ellipse 80% 50% at 15% 0%, rgba(99,102,241,0.22) 0%, transparent 60%),' +
    'radial-gradient(ellipse 60% 40% at 90% 10%, rgba(230,57,70,0.14) 0%, transparent 55%),' +
    'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(72,202,228,0.10) 0%, transparent 60%),' +
    '#0b0b1f',
};

export const glass: CSSProperties = {
  background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 10px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

export const accentGradient = 'linear-gradient(135deg, #e63946 0%, #f77f00 100%)';
export const goldGradient = 'linear-gradient(135deg, #f5d27a 0%, #d4a24c 100%)';

export function GlassCard({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ ...glass, ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  activated: { label: 'Active', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
  paid: { label: 'Activating', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' },
  pending: { label: 'Unpaid', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)' },
  failed: { label: 'Failed', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  expired: { label: 'Expired', color: '#a1a1aa', bg: 'rgba(161,161,170,0.10)', border: 'rgba(161,161,170,0.25)' },
  delivered: { label: 'Delivered', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {label || s.label}
    </span>
  );
}

// Circular "days left" meter. `fraction` is the share of the plan still remaining (0–1).
export function DaysRing({ days, fraction, size = 128 }: { days: number; fraction: number; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.min(1, Math.max(0, fraction));
  const color = days <= 3 ? '#f87171' : days <= 7 ? '#fbbf24' : '#4ade80';
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-white leading-none">{days}</span>
        <span className="text-[11px] uppercase tracking-widest text-gray-400 mt-1">days left</span>
      </div>
    </div>
  );
}

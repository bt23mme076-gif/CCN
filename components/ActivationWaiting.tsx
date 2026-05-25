'use client';

import { useEffect, useState, useCallback } from 'react';

interface ActivationWaitingProps {
  rechargeId: string;
  planName: string;
  amount: number;
  onActivated: () => void;
}

const TIMER_SECONDS = 5 * 60; // 5 minutes

export default function ActivationWaiting({
  rechargeId,
  planName,
  amount,
  onActivated,
}: ActivationWaitingProps) {
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [activated, setActivated] = useState(false);
  const [cycle, setCycle] = useState(1); // which 5-min cycle we're on

  // 5-min countdown that resets until activated
  useEffect(() => {
    if (activated) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setCycle((c) => c + 1); // next cycle
          return TIMER_SECONDS;   // reset to 5:00
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activated]);

  // Poll every 10 seconds to check if activated
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/recharge/history', { cache: 'no-store' });
      const data = await res.json();
      const recharge = (data.recharges || []).find(
        (r: { id: string; status: string }) => r.id === rechargeId
      );
      if (recharge && recharge.status === 'activated') {
        setActivated(true);
        setTimeout(() => onActivated(), 3000);
      }
    } catch {
      // silently ignore
    }
  }, [rechargeId, onActivated]);

  useEffect(() => {
    checkStatus();
    const poll = setInterval(checkStatus, 10000);
    return () => clearInterval(poll);
  }, [checkStatus]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Progress for the ring (0 to 1)
  const progress = (TIMER_SECONDS - timeLeft) / TIMER_SECONDS;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // ── ACTIVATED SCREEN ──────────────────────────────────────────────
  if (activated) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
      >
        <div className="text-center">
          <div className="relative mx-auto mb-6 w-28 h-28">
            <div className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
            <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Your TV is Ready!</h1>
          <p className="text-green-300 text-lg mb-2">
            <span className="font-bold text-white">{planName}</span> is now active 🎉
          </p>
          <p className="text-blue-300 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // ── WAITING SCREEN ────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}
    >
      {/* Top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)' }} />

      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Circular countdown timer */}
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" className="-rotate-90">
            {/* Background ring */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>

          {/* Timer text inside ring */}
          <div className="absolute flex flex-col items-center">
            <span
              className="text-4xl font-mono font-extrabold tabular-nums"
              style={{
                background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] text-blue-400 uppercase tracking-widest mt-0.5">
              {cycle > 1 ? `Round ${cycle}` : 'Processing'}
            </span>
          </div>
        </div>

        {/* Plan info card */}
        <div
          className="w-full rounded-2xl p-5 text-center"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Plan name & amount */}
          <p className="text-white font-bold text-xl mb-0.5">{planName}</p>
          <p className="text-blue-300 text-sm mb-4">
            ₹{(amount / 100).toFixed(0)} &nbsp;•&nbsp; Payment Confirmed ✓
          </p>

          {/* Main message */}
          <div
            className="rounded-xl p-4 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {/* Animated scrolling ticker */}
            <div className="overflow-hidden rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="flex whitespace-nowrap animate-marquee py-2">
                {[0, 1].map((i) => (
                  <span key={i} className="flex items-center gap-6 px-4 text-sm font-semibold">
                    <span className="text-yellow-300">📺 Keep your TV ON</span>
                    <span className="text-white">•</span>
                    <span className="text-blue-300">📡 Keep your STB ON</span>
                    <span className="text-white">•</span>
                    <span className="text-green-300">⏱ Stay on for 5 minutes</span>
                    <span className="text-white">•</span>
                    <span className="text-purple-300">✨ Channels loading soon</span>
                    <span className="text-white">•</span>
                  </span>
                ))}
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              Your recharge is almost done — it takes a little time to activate.
              <br /><br />
              <span className="text-blue-200 font-medium">
                Sit back and relax 😊 Your STB is being recharged.
              </span>
            </p>
          </div>
        </div>

        {/* Status steps */}
        <div className="w-full space-y-2.5">
          <StatusStep icon="✓" label="Payment received" done color="text-green-400" />
          <StatusStep icon="⟳" label="Your recharge is being activated" active color="text-yellow-400" />
          <StatusStep icon="○" label="TV ready — channels loading" done={false} color="text-gray-500" />
        </div>

        {/* Skip link */}
        <button
          onClick={onActivated}
          className="text-gray-600 hover:text-gray-400 text-xs underline transition-colors mt-2"
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}

function StatusStep({
  icon, label, done, active, color,
}: {
  icon: string;
  label: string;
  done: boolean;
  active?: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 ${color} ${active ? 'animate-spin' : ''}`}>
        {icon}
      </span>
      <span className={`text-sm ${done ? 'text-green-400' : active ? 'text-yellow-300 font-medium' : color}`}>
        {label}
      </span>
    </div>
  );
}

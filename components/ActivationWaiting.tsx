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
  const [showSuccess, setShowSuccess] = useState(false);

  // 5-min countdown that resets until activated
  useEffect(() => {
    if (activated) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? TIMER_SECONDS : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activated]);

  // Poll every 10 seconds
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/recharge/history', { cache: 'no-store' });
      const data = await res.json();
      const recharge = (data.recharges || []).find(
        (r: { id: string; status: string }) => r.id === rechargeId
      );
      if (recharge && recharge.status === 'activated') {
        setActivated(true);
        setShowSuccess(true);
        setTimeout(() => onActivated(), 3500);
      }
    } catch {
      // ignore
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

  // Progress 0→1 as timer counts down
  const progress = (TIMER_SECONDS - timeLeft) / TIMER_SECONDS;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - progress);

  // ── SUCCESS TOAST ─────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="mb-6 rounded-2xl overflow-hidden shadow-xl"
        style={{
          background: 'linear-gradient(135deg, #064e3b, #065f46)',
          border: '1px solid rgba(34,197,94,0.4)',
        }}
      >
        <div className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg">Your TV is Ready! 🎉</p>
            <p className="text-green-300 text-sm">{planName} is now active. Enjoy your channels!</p>
          </div>
        </div>
      </div>
    );
  }

  // ── INLINE ACTIVATION BANNER ──────────────────────────────────────
  return (
    <div
      className="mb-6 rounded-2xl overflow-hidden shadow-xl"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)',
        border: '1px solid rgba(139,92,246,0.35)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full"
        style={{ background: 'linear-gradient(90deg, #e94560, #f5a623, #a78bfa, #e94560)' }} />

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-4">

          {/* Small circular countdown clock */}
          <div className="relative flex-shrink-0 flex items-center justify-center w-16 h-16">
            <svg width="64" height="64" className="-rotate-90 absolute inset-0">
              {/* bg ring */}
              <circle cx="32" cy="32" r={radius}
                fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
              {/* progress ring */}
              <circle cx="32" cy="32" r={radius}
                fill="none"
                stroke="url(#cg)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            {/* Timer text */}
            <span className="relative text-sm font-mono font-extrabold text-white tabular-nums z-10">
              {formatTime(timeLeft)}
            </span>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-yellow-300 font-semibold text-sm truncate">
                {planName} — ₹{(amount / 100).toFixed(0)} ✓
              </span>
            </div>
            <p className="text-white text-sm font-medium leading-snug">
              📺 Your recharge is almost done!
            </p>
            <p className="text-blue-200 text-xs mt-0.5 leading-relaxed">
              Keep your TV <span className="text-yellow-300 font-semibold">switched ON</span> and relax.
              Don&apos;t call or take tension 😊
            </p>
          </div>

          {/* Skip */}
          <button
            onClick={onActivated}
            className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1"
            title="Go to dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

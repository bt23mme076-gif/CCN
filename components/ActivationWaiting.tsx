'use client';

import { useEffect, useState, useCallback } from 'react';

interface ActivationWaitingProps {
  rechargeId: string;
  planName: string;
  amount: number;
  onActivated: () => void;
}

export default function ActivationWaiting({
  rechargeId,
  planName,
  amount,
  onActivated,
}: ActivationWaitingProps) {
  const [seconds, setSeconds] = useState(0);
  const [activated, setActivated] = useState(false);
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(dotsTimer);
  }, []);

  // Count-up timer — stops only when activated
  useEffect(() => {
    if (activated) return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activated]);

  // Poll every 10 seconds to check if admin has activated
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/recharge/history', { cache: 'no-store' });
      const data = await res.json();
      const recharge = (data.recharges || []).find(
        (r: { id: string; status: string }) => r.id === rechargeId
      );
      if (recharge && recharge.status === 'activated') {
        setActivated(true);
        setTimeout(() => onActivated(), 3000); // show success for 3s then redirect
      }
    } catch {
      // silently ignore
    }
  }, [rechargeId, onActivated]);

  useEffect(() => {
    // Check immediately, then every 10 seconds
    checkStatus();
    const poll = setInterval(checkStatus, 10000);
    return () => clearInterval(poll);
  }, [checkStatus]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // ── ACTIVATED SCREEN ──────────────────────────────────────────────
  if (activated) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{
          background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        }}
      >
        <div className="text-center">
          {/* Success checkmark */}
          <div className="relative mx-auto mb-6 w-28 h-28">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }}
            />
            <div
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
            >
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Plan Activated!
          </h1>
          <p className="text-green-300 text-lg mb-2">
            Your <span className="font-bold text-white">{planName}</span> is now live
          </p>
          <p className="text-blue-300 text-sm">
            Activated in {formatTime(seconds)} • Redirecting to dashboard{dots}
          </p>
        </div>
      </div>
    );
  }

  // ── WAITING SCREEN ────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {/* Top shimmer line */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)',
        }}
      />

      {/* TV Icon with pulse */}
      <div className="relative mb-8">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse"
          style={{ background: 'radial-gradient(circle, #e94560, transparent)' }}
        />
        <div
          className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}
        >
          {/* TV SVG */}
          <svg className="w-14 h-14 sm:w-16 sm:h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-6 text-center">
        <p className="text-blue-300 text-sm font-medium uppercase tracking-widest mb-2">
          Activation in progress
        </p>
        <div
          className="text-6xl sm:text-7xl font-mono font-extrabold tabular-nums"
          style={{
            background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {formatTime(seconds)}
        </div>
        <p className="text-gray-400 text-xs mt-2">Timer stops when your plan is activated</p>
      </div>

      {/* Main message */}
      <div
        className="w-full max-w-sm rounded-2xl p-5 sm:p-6 mb-6 text-center"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-300 font-semibold text-sm">Your recharge is activating</span>
        </div>
        <p className="text-white font-bold text-lg mb-1">{planName}</p>
        <p className="text-blue-300 text-sm mb-4">
          ₹{(amount / 100).toFixed(0)} • Payment Confirmed ✓
        </p>
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <p className="text-white text-base sm:text-lg font-semibold leading-relaxed">
            📺 Keep your TV <span className="text-yellow-300">switched ON</span> and wait{dots}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Our operator is processing your activation. This usually takes a few minutes.
          </p>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="w-full max-w-sm h-1.5 rounded-full overflow-hidden mb-6"
        style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min((seconds / 300) * 100, 95)}%`,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #e94560)',
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-2">
        <Step done icon="✓" label="Payment received" color="text-green-400" />
        <Step done={false} icon="⟳" label="Operator activating your plan" color="text-yellow-400" spinning />
        <Step done={false} icon="○" label="Activation complete — TV ready" color="text-gray-500" />
      </div>

      {/* Go to dashboard link */}
      <button
        onClick={onActivated}
        className="mt-8 text-gray-500 hover:text-gray-300 text-sm underline transition-colors"
      >
        Skip and go to dashboard
      </button>
    </div>
  );
}

function Step({
  done, icon, label, color, spinning,
}: {
  done: boolean;
  icon: string;
  label: string;
  color: string;
  spinning?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-6 h-6 flex items-center justify-center text-sm font-bold ${color} ${
          spinning ? 'animate-spin' : ''
        }`}
      >
        {icon}
      </span>
      <span className={`text-sm ${done ? 'text-green-400' : color}`}>{label}</span>
    </div>
  );
}

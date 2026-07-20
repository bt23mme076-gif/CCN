'use client';

import { useEffect, useState, useCallback } from 'react';

interface ActivationWaitingProps {
  rechargeId: string;
  planName: string;
  amount: number;
  hasActivePlan?: boolean;
  activePlanExpiry?: string | Date | null;
  onActivated: () => void;
}

const TIMER_SECONDS = 5 * 60;
const STORAGE_KEY = 'ccn_activation_start';

const MESSAGES = [
  { icon: '📺', text: 'Keep your TV switched ON', color: '#facc15' },
  { icon: '📡', text: 'Keep your STB switched ON', color: '#60a5fa' },
  { icon: '⏱️', text: 'Stay on for at least 5 minutes', color: '#a78bfa' },
  { icon: '😊', text: 'Sit back and relax', color: '#34d399' },
  { icon: '✨', text: 'Your channels are loading soon', color: '#f472b6' },
];

function getElapsedSeconds(rechargeId: string): number {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${rechargeId}`);
    if (!raw) return 0;
    return Math.floor((Date.now() - parseInt(raw, 10)) / 1000);
  } catch { return 0; }
}

function saveStartTime(rechargeId: string) {
  try {
    const key = `${STORAGE_KEY}_${rechargeId}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, Date.now().toString());
    }
  } catch { /* ignore */ }
}

function clearStartTime(rechargeId: string) {
  try { localStorage.removeItem(`${STORAGE_KEY}_${rechargeId}`); } catch { /* ignore */ }
}

export default function ActivationWaiting({ rechargeId, planName, amount, hasActivePlan, activePlanExpiry, onActivated }: ActivationWaitingProps) {
  const [activated, setActivated] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(true);
  const [timerState, setTimerState] = useState({ timeLeft: TIMER_SECONDS, cycle: 1 });

  const getTimerState = useCallback(() => {
    const elapsed = getElapsedSeconds(rechargeId);
    const positionInCycle = elapsed % TIMER_SECONDS;
    return {
      timeLeft: TIMER_SECONDS - positionInCycle,
      cycle: Math.floor(elapsed / TIMER_SECONDS) + 1,
    };
  }, [rechargeId]);

  // Save start time once, then sync timer
  useEffect(() => {
    saveStartTime(rechargeId);
    setTimerState(getTimerState());
  }, [rechargeId, getTimerState]);

  // Tick every second from real elapsed time
  useEffect(() => {
    if (activated) return;
    const timer = setInterval(() => setTimerState(getTimerState()), 1000);
    return () => clearInterval(timer);
  }, [activated, getTimerState]);

  // Typewriter effect
  useEffect(() => {
    const full = MESSAGES[msgIndex].text;
    if (typing) {
      if (displayed.length < full.length) {
        const t = setTimeout(() => setDisplayed(full.slice(0, displayed.length + 1)), 60);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setTyping(false), 2000);
      return () => clearTimeout(t);
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        return () => clearTimeout(t);
      }
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
      setTyping(true);
    }
  }, [displayed, typing, msgIndex]);

  // Poll every 10s for activation
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/recharge/history', { cache: 'no-store' });
      const data = await res.json();
      const recharge = (data.recharges || []).find(
        (r: { id: string; status: string }) => r.id === rechargeId
      );
      if (recharge?.status === 'activated') {
        clearStartTime(rechargeId);
        setActivated(true);
        setTimeout(() => onActivated(), 3000);
      }
    } catch { /* ignore */ }
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

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (TIMER_SECONDS - timerState.timeLeft) / TIMER_SECONDS;
  const strokeDashoffset = circumference * (1 - progress);

  // ── ACTIVATED SCREEN ─────────────────────────────────────────────
  if (activated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
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

  // ── FUTURE RECHARGE SCREEN (customer already has an active plan) ──
  if (hasActivePlan) {
    const expiryLabel = activePlanExpiry
      ? new Date(activePlanExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-8"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)' }} />

        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          {/* Icon */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
            <div className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #6366f1)' }}>
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Message */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Recharge Confirmed!</h1>
            <p className="text-blue-200 text-base leading-relaxed">
              Aapka <span className="text-white font-bold">{planName}</span> recharge ho gaya hai.
            </p>
            <p className="text-blue-300 text-sm mt-2 leading-relaxed">
              Ye plan aapke existing plan ke{' '}
              {expiryLabel
                ? <span className="text-yellow-300 font-semibold">khatam hone ke baad ({expiryLabel})</span>
                : <span className="text-yellow-300 font-semibold">khatam hone ke baad</span>
              }{' '}
              automatically chalu ho jayega. 🎉
            </p>
          </div>

          {/* Info card */}
          <div className="w-full rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}>
            <div className="space-y-3 text-sm text-left">
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-green-300">Payment received & confirmed</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-green-300">Recharge queued by operator</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-blue-400 text-lg">⏰</span>
                <span className="text-blue-200">Will auto-activate after current plan ends</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-4 text-center">
              ₹{(amount / 100).toFixed(0)} successfully paid
            </p>
          </div>

          <button
            onClick={onActivated}
            className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #6366f1)' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── WAITING SCREEN ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      <div className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'linear-gradient(90deg, transparent, #e94560, #f5a623, #e94560, transparent)' }} />

      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Circular timer */}
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle cx="70" cy="70" r={radius} fill="none" stroke="url(#timerGrad)"
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-mono font-extrabold tabular-nums"
              style={{
                background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
              {formatTime(timerState.timeLeft)}
            </span>
            <span className="text-[10px] text-blue-400 uppercase tracking-widest mt-0.5">
              {timerState.cycle > 1 ? `Round ${timerState.cycle}` : 'Processing'}
            </span>
          </div>
        </div>

        {/* Plan info card */}
        <div className="w-full rounded-2xl p-5 text-center"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>

          <p className="text-white font-bold text-xl mb-0.5">{planName}</p>
          <p className="text-blue-300 text-sm mb-4">
            ₹{(amount / 100).toFixed(0)} &nbsp;•&nbsp; Payment Confirmed ✓
          </p>

          {/* Typewriter message box */}
          <div className="rounded-xl p-4 min-h-[90px] flex flex-col items-center justify-center transition-all duration-300"
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${MESSAGES[msgIndex].color}44` }}>
            <span className="text-2xl mb-2">{MESSAGES[msgIndex].icon}</span>
            <p className="text-base font-bold min-h-[28px]" style={{ color: MESSAGES[msgIndex].color }}>
              {displayed}
              <span className="inline-block w-0.5 h-5 ml-0.5 align-middle animate-pulse"
                style={{ background: MESSAGES[msgIndex].color }} />
            </p>
          </div>

          <p className="text-gray-400 text-xs mt-3">
            Your recharge is almost done — it takes a little time to activate.
          </p>
        </div>

        {/* Status steps */}
        <div className="w-full space-y-2.5">
          <StatusStep icon="✓" label="Payment received" done color="text-green-400" />
          <StatusStep icon="⟳" label="Your recharge is being activated" active color="text-yellow-400" />
          <StatusStep icon="○" label="TV ready — channels loading" color="text-gray-500" />
        </div>

        <button onClick={onActivated}
          className="text-gray-600 hover:text-gray-400 text-xs underline transition-colors mt-2">
          Go to dashboard
        </button>
      </div>
    </div>
  );
}

function StatusStep({ icon, label, done, active, color }: {
  icon: string; label: string; done?: boolean; active?: boolean; color: string;
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

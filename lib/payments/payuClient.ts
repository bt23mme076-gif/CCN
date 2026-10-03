'use client';

export interface PayuLaunchParams {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1: string;
  udf2: string;
  hash: string;
}

interface BoltResponse {
  response?: { txnStatus?: string } & Record<string, unknown>;
}

declare global {
  interface Window {
    bolt?: {
      launch: (
        data: PayuLaunchParams,
        handlers: {
          responseHandler: (response: BoltResponse) => void;
          catchException: (response: BoltResponse) => void;
        }
      ) => void;
    };
  }
}

// Covers the gap between the bolt.js overlay closing and the redirect that
// follows — without this, the underlying page (still showing its "Pay Now"
// button, since React state there resets as soon as the overlay launches)
// flashes visibly while /api/payu/confirm runs and the browser navigates on.
let confirmingOverlay: HTMLDivElement | null = null;

function showConfirmingOverlay(): void {
  if (typeof document === 'undefined' || confirmingOverlay) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:rgba(15,12,41,0.95);';
  overlay.innerHTML = `
    <div style="width:40px;height:40px;border:3px solid rgba(255,255,255,0.2);border-top-color:#22c55e;border-radius:50%;animation:payu-spin 0.8s linear infinite;"></div>
    <p style="color:#fff;font-family:sans-serif;font-size:14px;">Confirming payment…</p>
    <style>@keyframes payu-spin{to{transform:rotate(360deg)}}</style>
  `;
  document.body.appendChild(overlay);
  confirmingOverlay = overlay;
}

function hideConfirmingOverlay(): void {
  confirmingOverlay?.remove();
  confirmingOverlay = null;
}

let scriptPromise: Promise<void> | null = null;

function loadBoltScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.bolt) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://jssdk.payu.in/bolt/bolt.min.js';
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load PayU checkout'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Launches the PayU Checkout Plus overlay on the same page. When the payment
// finishes inside the overlay, bolt.js hands the signed result to
// responseHandler instead of redirecting — we post it to /api/payu/confirm,
// which hash-verifies it, marks the order and tells us where to send the
// customer (dashboard activation timer / recharge-status). onFallback resets
// the caller's UI when the overlay fails to load or the customer closes it.
export async function launchPayu(params: PayuLaunchParams, onFallback: () => void): Promise<void> {
  try {
    await loadBoltScript();
    if (!window.bolt) throw new Error('PayU checkout unavailable');
    window.bolt.launch(params, {
      responseHandler: async ({ response }) => {
        if (!response || response.txnStatus === 'CANCEL') {
          onFallback();
          return;
        }
        showConfirmingOverlay();
        try {
          const res = await fetch('/api/payu/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const data = await res.json();
          window.location.href = data.redirect || '/dashboard';
        } catch {
          // The webhook still records the payment; land on the dashboard.
          window.location.href = '/dashboard';
        }
      },
      catchException: () => {
        hideConfirmingOverlay();
        onFallback();
      },
    });
  } catch (error) {
    console.error('PayU launch failed:', error);
    onFallback();
  }
}

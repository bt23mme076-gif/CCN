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
  response?: { txnStatus?: string };
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

// Launches the PayU Checkout Plus overlay on the same page. The actual
// payment confirmation happens server-side (surl/furl POST to
// /api/payu/callback, which redirects the browser onward) — onFallback is
// only called if the overlay itself fails to load/launch or the user closes
// it without a server redirect happening, so the caller can reset its UI.
export async function launchPayu(params: PayuLaunchParams, onFallback: () => void): Promise<void> {
  try {
    await loadBoltScript();
    if (!window.bolt) throw new Error('PayU checkout unavailable');
    window.bolt.launch(params, {
      responseHandler: () => onFallback(),
      catchException: () => onFallback(),
    });
  } catch (error) {
    console.error('PayU launch failed:', error);
    onFallback();
  }
}

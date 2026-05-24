declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeConfig {
    mode: 'sandbox' | 'production';
  }

  export interface CheckoutOptions {
    paymentSessionId: string;
    returnUrl?: string;
    redirectTarget?: '_self' | '_blank' | '_parent' | '_top';
  }

  export interface PaymentResult {
    error?: {
      message: string;
      code: string;
    };
    redirect?: boolean;
    paymentDetails?: {
      paymentMessage: string;
      paymentTime: string;
      paymentStatus: string;
      paymentAmount: number;
      orderId: string;
    };
  }

  export interface Cashfree {
    checkout(options: CheckoutOptions): Promise<PaymentResult>;
  }

  export function load(config: CashfreeConfig): Promise<Cashfree>;
}

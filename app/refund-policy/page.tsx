import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Refund & Cancellation Policy — Chandni Cable Network',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <section className="bg-gradient-hero text-white py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Refund &amp; Cancellation Policy</h1>
          <p className="text-gray-300 text-sm">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </section>

      <div className="flex-1 py-10 sm:py-14 px-4 sm:px-6">
        <div className="card max-w-3xl mx-auto space-y-6 text-sm sm:text-base leading-relaxed text-gray-700">
          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">1. Subscription Recharges</h2>
            <p>
              Once a subscription plan is successfully recharged and activated, it cannot be cancelled,
              changed, or refunded. This applies to base plans, multi-month recharges, and Ala Carte
              channel add-ons.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">2. Failed or Duplicate Payments</h2>
            <p>
              If an amount was deducted from your bank account/UPI but your recharge was not
              activated or reflected on your dashboard, or if you were charged more than once for the
              same recharge, please contact us immediately with your UPI transaction reference
              (UTR) and order ID. We will verify the transaction against our bank statement and
              refund any confirmed duplicate or failed-but-deducted amount to your original payment
              method.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">3. Accessories</h2>
            <p>
              Physical accessories (remote controls, cables, adapters, etc.) purchased through the
              website can be replaced if found defective on delivery. Please contact us within 48
              hours of delivery with photos/details of the issue.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">4. Refund Processing Time</h2>
            <p>
              Approved refunds are processed back to the original payment method within 5–7 business
              days, subject to your bank's/UPI provider's processing timelines.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">5. How to Request a Refund</h2>
            <p>
              Contact us on WhatsApp or phone with your registered mobile number, order ID, and a
              brief description of the issue:
            </p>
            <p className="mt-2">
              Chandni Cable Network<br />
              Phone: <a href="tel:+919399974696" className="text-accent-blue underline">+91 93999 74696</a><br />
              Email: <a href="mailto:jatinrai254@gmail.com" className="text-accent-blue underline">jatinrai254@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

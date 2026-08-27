import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — Chandni Cable Network',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <section className="bg-gradient-hero text-white py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Terms &amp; Conditions</h1>
          <p className="text-gray-300 text-sm">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </section>

      <div className="flex-1 py-10 sm:py-14 px-4 sm:px-6">
        <div className="card max-w-3xl mx-auto space-y-6 text-sm sm:text-base leading-relaxed text-gray-700">
          <p>
            These Terms &amp; Conditions ("Terms") govern your use of the website
            (ccn.atyant.in) and the cable TV subscription services offered by{' '}
            <strong>Chandni Cable Network</strong> (Udyam MSME Registration No.
            UDYAM-MP-13-0025439), located at Main, Chaurai, Madhya Pradesh, 480115.
            By using this website or subscribing to our services, you agree to these Terms.
          </p>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">1. Services Offered</h2>
            <p>
              We provide cable TV subscription plans, channel add-ons ("Ala Carte"), and related
              accessories to customers within our service area. Plans, pricing, and channel lineups
              are displayed on our website and may be updated from time to time.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">2. Account Registration</h2>
            <p>
              To recharge or manage your subscription, you may need to register using your mobile
              number and set-top box (STB) number. You are responsible for keeping your account PIN
              confidential and for all activity under your account.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">3. Payments</h2>
            <p>
              All online payments are processed securely through our payment gateway partner,
              Cashfree Payments. We do not store your card, UPI, or net-banking credentials. Once
              payment is confirmed, your recharge is queued for activation by our operations team.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">4. Activation</h2>
            <p>
              Recharges are typically activated shortly after successful payment. Activation may be
              delayed in rare cases due to technical or operational reasons; in such cases, please
              contact our support team using the details below.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">5. Cancellations &amp; Refunds</h2>
            <p>
              Please see our <Link href="/refund-policy" className="text-accent-blue underline">Refund &amp; Cancellation Policy</Link> for details.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">6. Service Availability</h2>
            <p>
              While we aim to provide uninterrupted service, occasional interruptions may occur due
              to technical, weather, or infrastructure-related issues beyond our control. We are not
              liable for losses arising from such interruptions.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">7. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of our services after any
              changes constitutes acceptance of the updated Terms.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">8. Governing Law</h2>
            <p>All disputes are subject to the jurisdiction of courts in Chaurai, Madhya Pradesh.</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">9. Contact Us</h2>
            <p>
              Chandni Cable Network<br />
              Main, Chaurai, Madhya Pradesh, 480115<br />
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

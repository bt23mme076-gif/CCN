import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy — Chandni Cable Network',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <section className="bg-gradient-hero text-white py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-300 text-sm">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </section>

      <div className="flex-1 py-10 sm:py-14 px-4 sm:px-6">
        <div className="card max-w-3xl mx-auto space-y-6 text-sm sm:text-base leading-relaxed text-gray-700">
          <p>
            This Privacy Policy explains how Chandni Cable Network (Udyam MSME Registration No.
            UDYAM-MP-13-0025439) collects, uses, and protects your information when you use our
            website and services.
          </p>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, mobile number, and area/address you provide during registration</li>
              <li>Set-top box (STB) number and connection details</li>
              <li>Recharge and payment history (amount, plan, date — not your card/UPI details)</li>
              <li>Device information used to send push notifications, if you enable them</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To activate and manage your cable TV subscription</li>
              <li>To match and verify UPI payments made to our business UPI ID</li>
              <li>To send you service updates, receipts, and expiry reminders (SMS/WhatsApp/push notification)</li>
              <li>To respond to support requests and retrack/complaint requests</li>
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">3. Payment Information</h2>
            <p>
              Payments are made directly via UPI to our business UPI ID — we do not use a
              third-party payment gateway and never collect or store your card number, UPI PIN,
              or net-banking credentials on our servers. We only record the UPI transaction
              reference (UTR) you submit, which we use to verify your payment against our bank
              statement.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">4. Data Sharing</h2>
            <p>
              We do not sell your personal information, and we do not share it with any
              third-party payment processor since payments go directly to our own UPI ID. Necessary
              details are shared only with our own operations team to activate and manage your
              subscription.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">5. Data Security</h2>
            <p>
              We use industry-standard measures — including encrypted connections (HTTPS) and secure
              password/PIN hashing — to protect your account information.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">6. Your Choices</h2>
            <p>
              You can update your account details or disable push notifications at any time from
              your dashboard. To request deletion of your account data, contact us using the details
              below.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">7. Contact Us</h2>
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

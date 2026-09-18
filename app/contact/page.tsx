import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Contact Us — Chandni Cable Network',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <section className="bg-gradient-hero text-white py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">Contact Us</h1>
          <p className="text-gray-300 text-sm">We&apos;re here to help with recharges, dues, and support</p>
        </div>
      </section>

      <div className="flex-1 py-10 sm:py-14 px-4 sm:px-6">
        <div className="card max-w-3xl mx-auto space-y-6 text-sm sm:text-base leading-relaxed text-gray-700">
          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">Registered Business</h2>
            <p>
              Chandni Cable Network<br />
              Udyam MSME Registration No. UDYAM-MP-13-0025439
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">Operating Address</h2>
            <p>Main, Chaurai, Madhya Pradesh, 480115, India</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">Phone</h2>
            <p>
              <a href="tel:+919399974696" className="text-accent-blue underline">+91 93999 74696</a>
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">Email</h2>
            <p>
              <a href="mailto:jatinrai254@gmail.com" className="text-accent-blue underline">jatinrai254@gmail.com</a>
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">Support Hours</h2>
            <p>24/7 support available via WhatsApp and phone for recharge and service issues.</p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-brand-navy mb-2">WhatsApp</h2>
            <p>
              <a
                href="https://wa.me/919399974696"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blue underline"
              >
                Message us on WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

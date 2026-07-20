'use client';

export default function ContactSection() {
  const contacts = [
    {
      href: 'https://wa.me/919399974696?text=Hi%2C%20I%20need%20help%20with%20my%20cable%20connection',
      label: 'WhatsApp Chat',
      sub: 'Instant replies on WhatsApp',
      value: '+91 93999 74696',
      gradient: 'from-green-500 to-emerald-600',
      glow: 'hover:shadow-green-200',
      ring: 'hover:ring-green-400',
      valueColor: 'text-green-600',
      icon: (
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      ),
    },
    {
      href: 'tel:+919399974696',
      label: 'Call Us',
      sub: 'Speak directly with our team',
      value: '+91 93999 74696',
      gradient: 'from-blue-500 to-blue-700',
      glow: 'hover:shadow-blue-200',
      ring: 'hover:ring-blue-400',
      valueColor: 'text-blue-600',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      href: 'mailto:jatinrai254@gmail.com',
      label: 'Email Us',
      sub: 'Send us your queries anytime',
      value: 'jatinrai254@gmail.com',
      gradient: 'from-purple-500 to-purple-700',
      glow: 'hover:shadow-purple-200',
      ring: 'hover:ring-purple-400',
      valueColor: 'text-purple-600',
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const faqs = [
    { color: 'bg-green-500', title: 'Plan Activation', desc: 'Plans are activated within 15 minutes of payment' },
    { color: 'bg-blue-500', title: 'Payment Issues', desc: 'Contact us immediately for payment-related queries' },
    { color: 'bg-purple-500', title: 'Technical Support', desc: '24/7 support for signal and connection issues' },
    { color: 'bg-red-500', title: 'Plan Changes', desc: 'Upgrade or change plans anytime from dashboard' },
  ];

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* grid-visible background — no opaque fill */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-purple-50/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-300/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Support
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-navy mb-4">
            Need Help?{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              We&apos;re Here for You!
            </span>
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto leading-relaxed">
            Have questions about our plans or need assistance? Our support team is available 24/7 to help you.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400" />
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-400" />
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {contacts.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl ${c.glow} ring-2 ring-transparent ${c.ring} transition-all duration-300 hover:-translate-y-1.5 flex flex-col`}
            >
              {/* Gradient top band with icon */}
              <div className={`bg-gradient-to-r ${c.gradient} flex items-center justify-center py-6`}>
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                  {c.icon}
                </div>
              </div>
              {/* Body */}
              <div className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                <h3 className="font-display text-lg font-bold text-brand-navy mb-1">{c.label}</h3>
                <p className="text-gray-500 text-sm mb-3">{c.sub}</p>
                <span className={`font-bold text-sm ${c.valueColor} break-all`}>{c.value}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Common Questions */}
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="font-display text-xl font-bold text-brand-navy mb-6 text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Common Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${f.color} mt-2 flex-shrink-0`} />
                <div>
                  <h4 className="font-semibold text-brand-navy text-sm mb-0.5">{f.title}</h4>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

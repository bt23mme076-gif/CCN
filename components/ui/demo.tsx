"use client"

import { motion } from "motion/react"

export default function PricingCreative() {
  return (
    <section className="relative flex flex-col items-center py-24">
      <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
        {/* Starter Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -6 }}
          animate={{ opacity: 1, y: 0, rotate: -6 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative z-10 w-72 rounded-2xl border border-pink-400/30 bg-black/40 px-8 py-10 text-foreground shadow-[0_0_0_1px_rgba(255,105,180,.08)_inset] backdrop-blur-md transition-transform hover:scale-105"
        >
          <div className="mb-2 text-lg font-bold text-pink-400">Starter</div>
          <div className="mb-4 text-3xl font-extrabold text-white">$5/mo</div>
          <ul className="mb-6 space-y-2 text-sm text-white/70">
            <li><span className="mr-2 text-emerald-400">✔</span>1 Project</li>
            <li><span className="mr-2 text-emerald-400">✔</span>Email Support</li>
          </ul>
          <button className="w-full rounded-md bg-pink-500 py-2 font-semibold text-[#111] hover:bg-pink-400 transition">
            Start Now
          </button>
        </motion.div>

        {/* Creative Pro Card (Floating) */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotate: 0 }}
          animate={{ opacity: 1, y: -20, rotate: 0 }}
          transition={{ type: "spring", duration: 0.7 }}
          className="relative z-20 w-80 scale-110 rounded-3xl border-4 border-pink-400/50 bg-gradient-to-b from-[#ff6fb1] to-[#ff3a95] px-10 py-14 text-[#1a1a1a] shadow-xl transition-transform hover:scale-[1.12]"
        >
          <motion.div
            animate={{ y: [10, 6, 10] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-black/20 bg-[#ff6fb1] px-5 py-1 text-xs font-extrabold text-[#1a1a1a] shadow"
          >
            Best Deal
          </motion.div>
          <div className="mb-2 text-lg font-bold">Creative Pro</div>
          <div className="mb-4 text-5xl font-black">$19/mo</div>
          <ul className="mb-6 space-y-2 text-base">
            <li><span className="mr-2 text-emerald-600">✔</span>Unlimited Projects</li>
            <li><span className="mr-2 text-emerald-600">✔</span>Priority Support</li>
            <li><span className="mr-2 text-emerald-600">✔</span>Team Collaboration</li>
            <li><span className="mr-2 text-emerald-600">✔</span>Early Access</li>
          </ul>
          <button className="w-full rounded-md bg-neutral-900 py-2 font-bold text-white hover:bg-neutral-800 transition">
            Go Pro
          </button>
        </motion.div>

        {/* Enterprise Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 6 }}
          animate={{ opacity: 1, y: 0, rotate: 6 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="relative z-10 w-72 rounded-2xl border border-pink-400/30 bg-black/40 px-8 py-10 text-foreground shadow-[0_0_0_1px_rgba(255,105,180,.08)_inset] backdrop-blur-md transition-transform hover:scale-105"
        >
          <div className="mb-2 text-lg font-bold text-pink-400">Enterprise</div>
          <div className="mb-4 text-3xl font-extrabold text-white">Custom</div>
          <ul className="mb-6 space-y-2 text-sm text-white/70">
            <li><span className="mr-2 text-emerald-400">✔</span>Dedicated Manager</li>
            <li><span className="mr-2 text-emerald-400">✔</span>Custom Integrations</li>
            <li><span className="mr-2 text-emerald-400">✔</span>SLA &amp; Support</li>
          </ul>
          <button className="w-full rounded-md bg-pink-500 py-2 font-semibold text-[#111] hover:bg-pink-400 transition">
            Contact Us
          </button>
        </motion.div>
      </div>
    </section>
  )
}

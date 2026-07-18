'use client';

import { useEffect, useState } from 'react';

interface ExpiringItem {
  rechargeId: string;
  planName: string;
  amount: number;
  expiresAt: string;
  customerName: string;
  customerMobile: string;
  customerId: string;
}

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' };

function getDaysLeft(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDaysBadge(days: number) {
  if (days <= 0) return { label: 'Today', color: '#e63946', bg: 'rgba(230,57,70,0.15)' };
  if (days === 1) return { label: 'Tomorrow', color: '#f77f00', bg: 'rgba(247,127,0,0.15)' };
  return { label: `${days} days left`, color: '#facc15', bg: 'rgba(250,204,21,0.12)' };
}

function WaIcon({ size }: { size: string }) {
  return (
    <svg className={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function buildWhatsAppLinks(name: string, mobile: string, planName: string, expiresAt: string) {
  const date = new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const msg = `Hello ${name}, your CCN Networks cable TV plan *${planName}* is expiring on *${date}*. Please recharge soon to avoid any interruption in service. Visit our website or call us for quick recharge!`;
  const phone = mobile.replace(/\D/g, '').replace(/^0/, '');
  const fullPhone = phone.startsWith('91') ? phone : '91' + phone;
  const encoded = encodeURIComponent(msg);
  return {
    regular: `https://wa.me/${fullPhone}?text=${encoded}`,
    business: `intent://send?phone=${fullPhone}&text=${encoded}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`,
  };
}

export default function ExpiringPage() {
  const [items, setItems] = useState<ExpiringItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/expiring')
      .then((r) => r.json())
      .then((d) => setItems(d.expiring || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">Expiring Plans</h1>
        <p className="text-gray-400 text-sm">Customers whose plans expire within the next 3 days</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={cardStyle}>
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-white font-semibold text-lg mb-1">All good!</p>
          <p className="text-gray-400 text-sm">No plans expiring in the next 3 days.</p>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="mb-5 rounded-2xl px-5 py-4 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(247,127,0,0.1))', border: '1px solid rgba(230,57,70,0.25)' }}>
            <span className="text-3xl font-black text-white">{items.length}</span>
            <div>
              <p className="text-white font-semibold text-sm">customers need a reminder</p>
              <p className="text-gray-400 text-xs">Click Send WhatsApp button to notify them directly</p>
            </div>
          </div>

          {/* Desktop table */}
          <div className="rounded-2xl overflow-hidden hidden md:block" style={cardStyle}>
            <table className="w-full admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Mobile</th>
                  <th>Plan</th>
                  <th>Expires On</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const days = getDaysLeft(item.expiresAt);
                  const badge = getDaysBadge(days);
                  return (
                    <tr key={item.rechargeId}>
                      <td className="font-medium text-white">{item.customerName}</td>
                      <td className="text-gray-400">{item.customerMobile}</td>
                      <td>{item.planName}</td>
                      <td className="text-gray-300">
                        {new Date(item.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ color: badge.color, background: badge.bg }}>
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <a href={buildWhatsAppLinks(item.customerName, item.customerMobile, item.planName, item.expiresAt).regular}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
                            <WaIcon size="w-3 h-3" /> WA
                          </a>
                          <a href={buildWhatsAppLinks(item.customerName, item.customerMobile, item.planName, item.expiresAt).business}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #075e54, #128c7e)' }}>
                            <WaIcon size="w-3 h-3" /> Business
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((item) => {
              const days = getDaysLeft(item.expiresAt);
              const badge = getDaysBadge(days);
              return (
                <div key={item.rechargeId} className="rounded-2xl p-4 space-y-3" style={cardStyle}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.customerName}</p>
                      <p className="text-xs text-gray-400">{item.customerMobile}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                      style={{ color: badge.color, background: badge.bg }}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>Plan: <span className="text-gray-200">{item.planName}</span></p>
                    <p>Expires: <span className="text-gray-200">
                      {new Date(item.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span></p>
                  </div>
                  <div className="flex gap-2">
                    <a href={buildWhatsAppLinks(item.customerName, item.customerMobile, item.planName, item.expiresAt).regular}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
                      <WaIcon size="w-4 h-4" /> WhatsApp
                    </a>
                    <a href={buildWhatsAppLinks(item.customerName, item.customerMobile, item.planName, item.expiresAt).business}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #075e54, #128c7e)' }}>
                      <WaIcon size="w-4 h-4" /> Business
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

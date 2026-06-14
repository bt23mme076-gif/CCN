'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Customer {
  name: string;
  mobile: string;
  stb_number: string;
  area: string;
}

interface OrderDetail {
  order: {
    id: string;
    accessory_name: string;
    amount: number;
    status: string;
    paid_at: string | null;
    delivered_at: string | null;
    delivered_by: string | null;
    created_at: string;
  };
  customer: Customer;
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(10px)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'white',
};

export default function DeliveriesPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'delivered'>('pending');
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const statusParam = activeTab === 'pending' ? 'paid' : 'delivered';
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      
      const response = await fetch(
        `/api/admin/deliveries?status=${statusParam}${searchParam}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Failed to fetch deliveries:', errData.error || response.statusText);
        setOrders([]);
        return;
      }
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch deliveries:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    if (!confirm('Mark this accessory as delivered?')) return;
    setDelivering(orderId);
    try {
      const response = await fetch(`/api/admin/deliveries/${orderId}/deliver`, {
        method: 'POST',
      });
      if (response.ok) {
        // Remove from list
        setOrders(orders.filter((o) => o.order.id !== orderId));
      } else {
        alert('Failed to mark order as delivered');
      }
    } catch (error) {
      alert('Failed to mark order as delivered');
    } finally {
      setDelivering(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">Accessory Deliveries</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Decide and track physical accessory deliveries to customer STB locations
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start sm:self-center">
          <button
            onClick={() => {
              setActiveTab('pending');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-accent-red text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending Delivery
          </button>
          <button
            onClick={() => {
              setActiveTab('delivered');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'delivered'
                ? 'bg-accent-red text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Delivered History
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by customer name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-xl text-sm outline-none placeholder-gray-500 transition-all"
            style={inputStyle}
          />
          <svg
            className="w-5 h-5 text-gray-500 absolute left-3 top-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Queue Listing */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#e63946', borderTopColor: 'transparent' }}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-500/10 border border-green-500/20"
            >
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">
              {activeTab === 'pending' ? 'All Deliveries Completed!' : 'No History Found'}
            </h3>
            <p className="text-gray-400 text-sm">
              {activeTab === 'pending' ? 'No accessory orders awaiting delivery' : 'No past deliveries recorded'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {orders.map(({ order, customer }) => (
              <div
                key={order.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 hover:bg-white/[0.01] transition-colors"
              >
                {/* Customer Info & Accessory Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #3a86c8, #48cae4)',
                    }}
                  >
                    {customer.name ? customer.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-1">
                      <h4 className="font-bold text-white text-base truncate">{customer.name}</h4>
                      <span className="text-xs text-purple-400 font-mono">
                        STB: {customer.stb_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'paid'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {order.status === 'paid' ? 'Paid' : 'Pending Payment'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">
                      Mobile: <span className="text-gray-200 font-semibold">{customer.mobile}</span>
                    </p>
                    <p className="text-xs text-gray-400 mb-2">
                      Delivery Address / Area: <span className="text-gray-200 font-semibold">{customer.area}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-gray-300 text-[10px] font-mono">
                        Order: {order.id.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status, Price & Action */}
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-3 pt-3 md:pt-0 border-t border-white/5 md:border-none">
                  <div className="text-left md:text-right">
                    <p className="font-bold text-white text-base md:text-lg">{order.accessory_name}</p>
                    <p className="text-sm font-bold text-green-400">{formatCurrency(order.amount)}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {order.status === 'paid' && order.paid_at
                        ? `Paid: ${formatDateTime(new Date(order.paid_at))}`
                        : `Ordered: ${formatDateTime(new Date(order.created_at))}`}
                    </p>
                  </div>

                  {activeTab === 'pending' ? (
                    <button
                      onClick={() => handleMarkDelivered(order.id)}
                      disabled={delivering === order.id}
                      className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
                      style={{
                        background: 'linear-gradient(135deg, #1b4332, #2d6a4f)',
                        boxShadow: '0 4px 15px rgba(45,106,79,0.3)',
                        border: '1px solid rgba(82,183,136,0.3)',
                      }}
                    >
                      {delivering === order.id ? 'Updating...' : '✓ Mark Delivered'}
                    </button>
                  ) : (
                    <div className="text-right">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-950/40 text-green-400 border border-green-800/40"
                      >
                        Delivered
                      </span>
                      {order.delivered_at && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          Delivered On: {formatDateTime(new Date(order.delivered_at))}
                        </p>
                      )}
                      {order.delivered_by && (
                        <p className="text-[9px] text-gray-500">
                          By: {order.delivered_by}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

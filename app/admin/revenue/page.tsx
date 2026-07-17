'use client';

import { useEffect, useState } from 'react';

interface RevenueData {
  summary: {
    today: number; todayCount: number;
    thisMonth: number; thisMonthCount: number;
    lastMonth: number;
    totalRevenue: number; totalCount: number;
  };
  daily: { day: string; total: number; count: number }[];
  monthly: { month: string; label: string; total: number; count: number }[];
  topPlans: { planName: string; total: number; count: number }[];
}

const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

function fmt(paise: number) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function BarChart({ data, valueKey, labelKey, color }: {
  data: any[]; valueKey: string; labelKey: string; color: string;
}) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="relative flex items-end gap-px w-full" style={{ height: 144 }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        return (
          <div key={i} className="flex-1 relative group" style={{ height: '100%' }}>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/10">
              {fmt(d[valueKey])}
            </div>
            {/* Bar anchored to bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-300"
              style={{
                height: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                background: pct > 0 ? color : 'transparent',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function MonthChart({ data }: { data: { label: string; total: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3 w-full" style={{ height: 176 }}>
      {data.map((d, i) => {
        const pct = (d.total / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative" style={{ height: '100%' }}>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/10">
              {fmt(d.total)}
              <br />
              <span className="text-gray-400">{d.count} recharges</span>
            </div>
            <div className="flex-1 w-full relative">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500"
                style={{
                  height: `${Math.max(pct, pct > 0 ? 3 : 0)}%`,
                  background: isLast
                    ? 'linear-gradient(180deg, #e63946, #f77f00)'
                    : 'linear-gradient(180deg, rgba(99,102,241,0.8), rgba(99,102,241,0.4))',
                }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium flex-shrink-0">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#e63946', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!data) return (
    <p className="text-red-400 text-center py-20">Failed to load revenue data.</p>
  );

  const { summary, daily, monthly, topPlans } = data;
  const growthPct = summary.lastMonth > 0
    ? (((summary.thisMonth - summary.lastMonth) / summary.lastMonth) * 100).toFixed(1)
    : null;
  const isGrowthPos = summary.thisMonth >= summary.lastMonth;

  const topPlanMax = Math.max(...topPlans.map((p) => p.total), 1);

  // Last 30 days: show every 5th label
  const dailyLabels = daily.map((d, i) => {
    if (i % 5 !== 0 && i !== daily.length - 1) return '';
    const dt = new Date(d.day);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">Revenue Dashboard</h1>
        <p className="text-gray-400 text-sm">Real-time earnings overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "Today's Revenue", value: fmt(summary.today),
            sub: `${summary.todayCount} recharges`,
            color: '#48cae4', bg: 'rgba(72,202,228,0.1)', border: 'rgba(72,202,228,0.2)',
          },
          {
            label: 'This Month', value: fmt(summary.thisMonth),
            sub: growthPct
              ? `${isGrowthPos ? '▲' : '▼'} ${Math.abs(Number(growthPct))}% vs last month`
              : `${summary.thisMonthCount} recharges`,
            color: isGrowthPos ? '#52b788' : '#e63946',
            bg: isGrowthPos ? 'rgba(82,183,136,0.1)' : 'rgba(230,57,70,0.1)',
            border: isGrowthPos ? 'rgba(82,183,136,0.2)' : 'rgba(230,57,70,0.2)',
          },
          {
            label: 'Last Month', value: fmt(summary.lastMonth),
            sub: 'previous period',
            color: '#f77f00', bg: 'rgba(247,127,0,0.1)', border: 'rgba(247,127,0,0.2)',
          },
          {
            label: 'All-Time Revenue', value: fmt(summary.totalRevenue),
            sub: `${summary.totalCount} total recharges`,
            color: '#c77dff', bg: 'rgba(199,125,255,0.1)', border: 'rgba(199,125,255,0.2)',
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-4 sm:p-5"
            style={{ background: card.bg, border: `1px solid ${card.border}` }}>
            <p className="text-xs text-gray-400 font-medium mb-2">{card.label}</p>
            <p className="text-xl sm:text-2xl font-black" style={{ color: card.color }}>{card.value}</p>
            <p className="text-[11px] text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Last 30 Days Bar Chart */}
      <div className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-bold text-base">Last 30 Days</h2>
            <p className="text-gray-500 text-xs mt-0.5">Daily revenue — hover for details</p>
          </div>
          <span className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            {daily.filter((d) => d.total > 0).length} active days
          </span>
        </div>
        <BarChart
          data={daily}
          valueKey="total"
          labelKey="day"
          color="linear-gradient(180deg, #e63946 0%, #f77f00 100%)"
        />
        {/* X-axis labels */}
        <div className="flex mt-2">
          {daily.map((_, i) => (
            <div key={i} className="flex-1 text-center text-[8px] text-gray-600">
              {dailyLabels[i]}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Revenue */}
        <div className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
          <div className="mb-5">
            <h2 className="text-white font-bold text-base">Monthly Revenue</h2>
            <p className="text-gray-500 text-xs mt-0.5">Last 6 months</p>
          </div>
          <MonthChart data={monthly} />
        </div>

        {/* Top Plans */}
        <div className="rounded-2xl p-5 sm:p-6" style={cardStyle}>
          <div className="mb-5">
            <h2 className="text-white font-bold text-base">Top Plans</h2>
            <p className="text-gray-500 text-xs mt-0.5">By total revenue earned</p>
          </div>
          {topPlans.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-4">
              {topPlans.map((plan, i) => {
                const pct = (plan.total / topPlanMax) * 100;
                const colors = ['#e63946', '#f77f00', '#facc15', '#52b788', '#48cae4'];
                return (
                  <div key={plan.planName}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black w-5 text-center"
                          style={{ color: colors[i] }}>#{i + 1}</span>
                        <span className="text-sm text-gray-200 font-medium truncate">{plan.planName}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-sm font-bold text-white">{fmt(plan.total)}</span>
                        <span className="text-[10px] text-gray-500 ml-1">({plan.count}x)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: colors[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

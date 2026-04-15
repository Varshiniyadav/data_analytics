'use client';

import { useEffect, useState } from 'react';
import { api, formatCurrency, formatNumber, KPIs, TrendData } from '@/lib/api';
import KPICard from '@/components/KPICard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function OverviewPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getTrends()])
      .then(([summary, trendsData]) => {
        setKpis(summary.kpis);
        setInsights(summary.insights);
        setTrends(trendsData.monthly_trends);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading overview..." />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Business Overview"
        subtitle="What is happening — current state of your sales operation"
      />

      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={formatCurrency(kpis.total_revenue)} change={kpis.yoy_growth} icon="💰" accent="bg-blue-500" subtitle="All-time" />
          <KPICard title="Total Profit" value={formatCurrency(kpis.total_profit)} icon="📈" accent="bg-emerald-500" subtitle={`${kpis.profit_margin.toFixed(1)}% margin`} />
          <KPICard title="Total Orders" value={formatNumber(kpis.total_orders)} icon="🛒" accent="bg-violet-500" subtitle={`Avg ${formatCurrency(kpis.avg_order_value)}/order`} />
          <KPICard title="Profit Margin" value={`${kpis.profit_margin.toFixed(1)}%`} icon="📊" accent="bg-amber-500" subtitle="Overall blended" />
        </div>
      )}

      {/* Insight highlight boxes */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, i) => (
            <InsightBox key={i} text={insight} index={i} />
          ))}
        </div>
      )}

      {/* Revenue & Profit trend chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Revenue & Profit Trends</h3>
        <p className="text-xs text-slate-400 mb-5">Monthly performance over time</p>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="Year-Month" tick={{ fontSize: 11 }} stroke="#CBD5E1" />
            <YAxis tick={{ fontSize: 11 }} stroke="#CBD5E1" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Sales" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Revenue" />
            <Line type="monotone" dataKey="Profit" stroke="#10B981" strokeWidth={2.5} dot={false} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InsightBox({ text, index }: { text: string; index: number }) {
  const icons = ['🔥', '📌', '💡', '⚠️', '🎯', '📊'];
  const colors = [
    'border-l-blue-400 bg-blue-50',
    'border-l-emerald-400 bg-emerald-50',
    'border-l-amber-400 bg-amber-50',
    'border-l-violet-400 bg-violet-50',
    'border-l-rose-400 bg-rose-50',
    'border-l-cyan-400 bg-cyan-50',
  ];
  return (
    <div className={`border-l-4 rounded-r-xl p-4 ${colors[index % colors.length]}`}>
      <p className="text-sm text-slate-700 font-medium">
        <span className="mr-2">{icons[index % icons.length]}</span>{text}
      </p>
    </div>
  );
}

export function PageLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-slate-200 pb-4">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api, formatCurrency, ProductData, RegionData } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { PageLoader, PageHeader } from '../page';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function DiagnosisPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [profitability, setProfitability] = useState<any>(null);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProducts(), api.getRegions()])
      .then(([p, r]) => {
        setProducts(p.products);
        setProfitability(p.profitability);
        setRegions(r.regions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Running diagnosis..." />;

  const top10 = products.slice(0, 10);
  const avgMargin = products.length
    ? products.reduce((s, p) => s + p['Profit Margin'], 0) / products.length
    : 0;
  const lowMargin = products.filter(p => p['Profit Margin'] < avgMargin * 0.75);
  const pieData = regions.map(r => ({ name: r.Region, value: r.Sales }));

  return (
    <div className="space-y-8">
      <PageHeader title="Diagnosis" subtitle="Why it is happening — identify root causes and performance gaps" />

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <Pill color="blue" label="Products Analyzed" value={String(products.length)} />
        <Pill color="emerald" label="Regions" value={String(regions.length)} />
        <Pill color="amber" label="Avg Margin" value={`${avgMargin.toFixed(1)}%`} />
        {profitability && <Pill color="violet" label="Overall Margin" value={`${profitability.overall_margin.toFixed(1)}%`} />}
        {lowMargin.length > 0 && <Pill color="red" label="Low-Margin Products" value={String(lowMargin.length)} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-1">Top 10 Products by Revenue</h3>
          <p className="text-xs text-slate-400 mb-4">Revenue vs Profit comparison</p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top10} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#CBD5E1" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="Product" tick={{ fontSize: 10 }} stroke="#CBD5E1" width={90} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="Sales" fill="#3B82F6" name="Revenue" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Profit" fill="#10B981" name="Profit" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Region pie + bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-1">Regional Market Share</h3>
          <p className="text-xs text-slate-400 mb-4">Revenue distribution by region</p>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={110} dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Region performance table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Regional Performance</h3>
          <span className="text-xs text-slate-400">Sorted by revenue</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Region</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3 text-right">Profit</th>
                <th className="px-6 py-3 text-right">Margin</th>
                <th className="px-6 py-3 text-right">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {regions.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    {r.Region}
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-slate-700">{formatCurrency(r.Sales)}</td>
                  <td className="px-6 py-3 text-sm text-right text-slate-700">{formatCurrency(r.Profit)}</td>
                  <td className="px-6 py-3 text-sm text-right">
                    <MarginBadge value={r['Profit Margin']} />
                  </td>
                  <td className="px-6 py-3 text-sm text-right text-slate-500">{r.Orders.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low margin products alert */}
      {lowMargin.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-amber-500">⚠️</span>
            <h3 className="text-base font-semibold text-slate-800">Low-Margin Products — Needs Attention</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Product</th>
                  <th className="px-6 py-3 text-right">Revenue</th>
                  <th className="px-6 py-3 text-right">Margin</th>
                  <th className="px-6 py-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lowMargin.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm font-medium text-slate-800">{p.Product}</td>
                    <td className="px-6 py-3 text-sm text-right text-slate-700">{formatCurrency(p.Sales)}</td>
                    <td className="px-6 py-3 text-sm text-right"><MarginBadge value={p['Profit Margin']} /></td>
                    <td className="px-6 py-3 text-sm text-right text-slate-500">{p.Orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ color, label, value }: { color: string; label: string; value: string }) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${map[color] ?? map.blue}`}>
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

function MarginBadge({ value }: { value: number }) {
  const cls = value > 30 ? 'bg-emerald-50 text-emerald-700' : value > 20 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{value.toFixed(1)}%</span>;
}

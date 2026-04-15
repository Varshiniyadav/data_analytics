'use client';

import { useEffect, useState } from 'react';
import { api, formatCurrency, ForecastData } from '@/lib/api';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { PageLoader, PageHeader } from '../page';

export default function ForecastPage() {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [trendMetrics, setTrendMetrics] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getForecast(6)
      .then(d => {
        setForecast(d.forecast);
        setTrendMetrics(d.trend_metrics);
        setHistoricalData(d.historical_data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Building forecast model..." />;

  const combinedData = [
    ...historicalData
      .filter((d: any) => d.Type === 'Historical')
      .map((d: any) => ({
        date: String(d.Date).substring(0, 7),
        actual: d.Forecasted_Revenue,
      })),
    ...forecast.map(f => ({
      date: f.date,
      forecast: f.forecast,
      lower: f.lower_bound,
      upper: f.upper_bound,
    })),
  ];

  // Find the boundary date between historical and forecast
  const lastHistoricalDate = historicalData.length
    ? String(historicalData[historicalData.length - 1].Date).substring(0, 7)
    : null;

  const isUpward = trendMetrics?.trend_direction === 'Upward';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Revenue Forecast"
        subtitle="Future view — 6-month prediction with confidence intervals"
      />

      {/* Trend metric cards */}
      {trendMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Trend Direction"
            value={`${isUpward ? '↑' : '↓'} ${trendMetrics.trend_direction}`}
            valueColor={isUpward ? 'text-emerald-600' : 'text-red-500'}
            sub="Based on linear regression"
          />
          <MetricCard
            label="Monthly Growth"
            value={`${trendMetrics.monthly_growth_rate > 0 ? '+' : ''}${trendMetrics.monthly_growth_rate.toFixed(2)}%`}
            valueColor={trendMetrics.monthly_growth_rate >= 0 ? 'text-emerald-600' : 'text-red-500'}
            sub="Average per month"
          />
          <MetricCard
            label="Model Confidence"
            value={`${trendMetrics.trend_strength.toFixed(1)}%`}
            valueColor="text-blue-600"
            sub="R² score"
          />
          <MetricCard
            label="Avg Monthly Revenue"
            value={formatCurrency(trendMetrics.avg_monthly_revenue)}
            valueColor="text-slate-800"
            sub="Historical average"
          />
        </div>
      )}

      {/* Forecast chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Revenue Forecast with Confidence Interval</h3>
            <p className="text-xs text-slate-400 mt-1">Shaded area = ±2 standard errors (95% confidence)</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" /> Historical</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded border-dashed border-t-2 border-emerald-500" /> Forecast</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-100 inline-block rounded" /> Confidence</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#CBD5E1" />
            <YAxis tick={{ fontSize: 11 }} stroke="#CBD5E1" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number, name: string) => [formatCurrency(v), name]}
              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
            />
            {lastHistoricalDate && (
              <ReferenceLine x={lastHistoricalDate} stroke="#CBD5E1" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10, fill: '#94A3B8' }} />
            )}
            <Area type="monotone" dataKey="upper" fill="#D1FAE5" stroke="none" name="Upper Bound" />
            <Area type="monotone" dataKey="lower" fill="#FFFFFF" stroke="none" name="Lower Bound" />
            <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Historical Revenue" connectNulls />
            <Line type="monotone" dataKey="forecast" stroke="#10B981" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: '#10B981', r: 4 }} name="Forecast" connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">6-Month Forecast Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-3 text-left">Month</th>
                <th className="px-6 py-3 text-right">Forecast</th>
                <th className="px-6 py-3 text-right">Lower Bound</th>
                <th className="px-6 py-3 text-right">Upper Bound</th>
                <th className="px-6 py-3 text-right">Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {forecast.map((item, i) => {
                const range = item.upper_bound - item.lower_bound;
                const rangePct = ((range / item.forecast) * 100).toFixed(1);
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-semibold text-slate-800">{item.date}</td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-emerald-600">{formatCurrency(item.forecast)}</td>
                    <td className="px-6 py-3 text-sm text-right text-slate-500">{formatCurrency(item.lower_bound)}</td>
                    <td className="px-6 py-3 text-sm text-right text-slate-500">{formatCurrency(item.upper_bound)}</td>
                    <td className="px-6 py-3 text-sm text-right">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">±{rangePct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology note */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
        <span className="text-xl mt-0.5">🔬</span>
        <div>
          <p className="text-sm font-semibold text-blue-800 mb-1">Forecasting Methodology</p>
          <p className="text-sm text-blue-700 leading-relaxed">
            Linear Regression on monthly time-series data. Confidence intervals represent ±2 standard errors
            of residuals. R² score indicates how well the trend explains historical variance — higher is more reliable.
            External factors (market shifts, competition) are not modeled.
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, valueColor, sub }: { label: string; value: string; valueColor: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

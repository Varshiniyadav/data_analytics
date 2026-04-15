'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, formatCurrency, SimulationResult } from '@/lib/api';
import { PageLoader, PageHeader } from '../page';

export default function SimulatorPage() {
  const [priceChange, setPriceChange] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [volumeChange, setVolumeChange] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const runSimulation = useCallback(async (p: number, d: number, v: number) => {
    setSimulating(true);
    try {
      const r = await api.simulate(p, d, v);
      setResult(r);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  }, []);

  // Load baseline on mount
  useEffect(() => {
    api.simulate(0, 0, 0)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Debounced re-simulation on slider change
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => runSimulation(priceChange, discount, volumeChange), 400);
    return () => clearTimeout(t);
  }, [priceChange, discount, volumeChange, loading, runSimulation]);

  if (loading) return <PageLoader label="Loading simulator..." />;

  const impactColor = result?.impact_level === 'positive'
    ? 'text-emerald-600' : result?.impact_level === 'negative'
    ? 'text-red-500' : 'text-slate-600';

  const impactBg = result?.impact_level === 'positive'
    ? 'bg-emerald-50 border-emerald-200' : result?.impact_level === 'negative'
    ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200';

  return (
    <div className="space-y-8">
      <PageHeader title="What-If Simulator" subtitle="Simulate decisions — test pricing and volume changes before committing" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <h3 className="text-base font-semibold text-slate-800">Adjust Parameters</h3>

            <SliderControl
              label="Price Change"
              value={priceChange}
              onChange={setPriceChange}
              min={-30} max={30} step={1}
              unit="%" positiveColor="text-emerald-600" negativeColor="text-red-500"
              hint="Increase or decrease your selling price"
            />
            <SliderControl
              label="Discount Applied"
              value={discount}
              onChange={setDiscount}
              min={0} max={40} step={1}
              unit="%" positiveColor="text-slate-600" negativeColor="text-slate-600"
              hint="Additional discount on top of current pricing"
            />
            <SliderControl
              label="Volume Change"
              value={volumeChange}
              onChange={setVolumeChange}
              min={-50} max={50} step={5}
              unit="%" positiveColor="text-emerald-600" negativeColor="text-red-500"
              hint="Expected change in number of orders"
            />

            <button
              onClick={() => { setPriceChange(0); setDiscount(0); setVolumeChange(0); }}
              className="w-full py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Reset to Baseline
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Impact explanation */}
          {result && (
            <div className={`rounded-2xl border p-5 ${impactBg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">
                  {result.impact_level === 'positive' ? '✅' : result.impact_level === 'negative' ? '❌' : 'ℹ️'}
                </span>
                <span className={`text-sm font-bold uppercase tracking-wide ${impactColor}`}>
                  {result.impact_level === 'positive' ? 'Positive Impact' : result.impact_level === 'negative' ? 'Negative Impact' : 'Neutral'}
                </span>
                {simulating && <span className="ml-auto text-xs text-slate-400 animate-pulse">Recalculating...</span>}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{result.explanation}</p>
            </div>
          )}

          {/* Metric comparison */}
          {result && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Impact Breakdown</h3>
              <div className="space-y-4">
                <MetricRow
                  label="Revenue"
                  base={result.base.revenue}
                  simulated={result.simulated.revenue}
                  delta={result.delta.revenue}
                  format={formatCurrency}
                />
                <MetricRow
                  label="Profit"
                  base={result.base.profit}
                  simulated={result.simulated.profit}
                  delta={result.delta.profit}
                  format={formatCurrency}
                />
                <MetricRow
                  label="Profit Margin"
                  base={result.base.margin}
                  simulated={result.simulated.margin}
                  delta={result.delta.margin}
                  format={(v) => `${v.toFixed(1)}%`}
                />
              </div>
            </div>
          )}

          {/* Profit change gauge */}
          {result && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Profit Change</h3>
              <div className="flex items-end gap-3">
                <span className={`text-4xl font-bold ${result.delta.profit_change_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {result.delta.profit_change_pct >= 0 ? '+' : ''}{result.delta.profit_change_pct.toFixed(1)}%
                </span>
                <span className="text-slate-400 text-sm mb-1">vs baseline</span>
              </div>
              <div className="mt-3 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${result.delta.profit_change_pct >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(100, Math.abs(result.delta.profit_change_pct))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min, max, step, unit, positiveColor, negativeColor, hint }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string;
  positiveColor: string; negativeColor: string; hint: string;
}) {
  const valueColor = value > 0 ? positiveColor : value < 0 ? negativeColor : 'text-slate-600';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        <span className={`text-lg font-bold ${valueColor}`}>
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

function MetricRow({ label, base, simulated, delta, format }: {
  label: string; base: number; simulated: number; delta: number; format: (v: number) => string;
}) {
  const isPositive = delta >= 0;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-slate-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-3">
        <span className="text-sm text-slate-400 line-through">{format(base)}</span>
        <span className="text-slate-300">→</span>
        <span className="text-sm font-bold text-slate-800">{format(simulated)}</span>
        <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
          {isPositive ? '+' : ''}{format(delta)}
        </span>
      </div>
    </div>
  );
}

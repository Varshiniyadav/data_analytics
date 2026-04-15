'use client';

import { useEffect, useState } from 'react';
import { api, Recommendation } from '@/lib/api';
import { PageLoader, PageHeader } from '../page';

const TYPE_CONFIG = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: '🚨', label: 'Critical' },
  warning:  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: '⚠️', label: 'Warning' },
  opportunity: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: '💡', label: 'Opportunity' },
};

const IMPACT_CONFIG = {
  high:   'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low:    'bg-slate-100 text-slate-500',
};

const CATEGORY_ICONS: Record<string, string> = {
  Product: '📦',
  Region: '🗺️',
  Trend: '📈',
  Profitability: '💰',
};

export default function AdvisorPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdvisor()
      .then(d => setRecs(d.recommendations))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Generating recommendations..." />;

  const categories = ['all', ...Array.from(new Set(recs.map(r => r.category)))];
  const filtered = filter === 'all' ? recs : recs.filter(r => r.category === filter);

  const counts = {
    critical: recs.filter(r => r.type === 'critical').length,
    warning: recs.filter(r => r.type === 'warning').length,
    opportunity: recs.filter(r => r.type === 'opportunity').length,
  };

  return (
    <div className="space-y-8">
      <PageHeader title="AI Business Advisor" subtitle="What to do — logic-driven recommendations ranked by business impact" />

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard icon="🚨" label="Critical" count={counts.critical} color="red" />
        <SummaryCard icon="⚠️" label="Warnings" count={counts.warning} color="amber" />
        <SummaryCard icon="💡" label="Opportunities" count={counts.opportunity} color="emerald" />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === cat
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            {cat === 'all' ? 'All' : `${CATEGORY_ICONS[cat] ?? '📌'} ${cat}`}
          </button>
        ))}
      </div>

      {/* Recommendation cards */}
      <div className="space-y-4">
        {filtered.map((rec, i) => {
          const cfg = TYPE_CONFIG[rec.type];
          return (
            <div key={i} className={`rounded-2xl border p-6 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cfg.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-800">{rec.title}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${IMPACT_CONFIG[rec.impact]}`}>
                        {rec.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      {CATEGORY_ICONS[rec.category] ?? '📌'} {rec.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-700 mt-4 leading-relaxed">{rec.message}</p>

              <div className="mt-4 flex items-start gap-2 bg-white/60 rounded-xl p-3 border border-white">
                <span className="text-base mt-0.5">🎯</span>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Recommended Action</p>
                  <p className="text-sm font-semibold text-slate-800">{rec.action}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-medium">No issues in this category</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  const map: Record<string, string> = {
    red: 'bg-red-50 border-red-100 text-red-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  };
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${map[color]}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs font-semibold opacity-70">{label}</p>
      </div>
    </div>
  );
}

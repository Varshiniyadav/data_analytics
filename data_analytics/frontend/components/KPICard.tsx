interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: string;
  accent?: string; // tailwind bg color class for left border
  subtitle?: string;
}

export default function KPICard({ title, value, change, icon, accent = 'bg-blue-500', subtitle }: KPICardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${accent} bg-opacity-10 flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5 truncate">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        {change !== undefined && (
          <div className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-600' :
            isNegative ? 'bg-red-50 text-red-500' :
            'bg-slate-50 text-slate-500'
          }`}>
            {isPositive ? '↑' : isNegative ? '↓' : '→'}
            {Math.abs(change).toFixed(1)}% vs last year
          </div>
        )}
      </div>
    </div>
  );
}

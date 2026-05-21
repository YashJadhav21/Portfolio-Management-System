import { cn } from "@/lib/utils";

const variantStyles = {
  blue: "stat-card-blue",
  purple: "stat-card-purple",
  emerald: "stat-card-emerald",
  amber: "stat-card-amber",
  rose: "stat-card-rose",
  cyan: "stat-card-cyan",
};

const iconBg = {
  blue: "bg-blue-500/20 text-blue-400",
  purple: "bg-purple-500/20 text-purple-400",
  emerald: "bg-emerald-500/20 text-emerald-400",
  amber: "bg-amber-500/20 text-amber-400",
  rose: "bg-rose-500/20 text-rose-400",
  cyan: "bg-cyan-500/20 text-cyan-400",
};

export default function StatsCard({ title, value, subtitle, icon: Icon, variant = "blue", loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 animate-pulse bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-start justify-between mb-4">
          <div className="h-4 bg-slate-700 rounded w-24" />
          <div className="w-10 h-10 bg-slate-700 rounded-xl" />
        </div>
        <div className="h-8 bg-slate-700 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-700 rounded w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-default",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-100 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

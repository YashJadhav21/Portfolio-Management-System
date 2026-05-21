import { cn } from "@/lib/utils";

const statusStyles = {
  Active: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  Inactive: "bg-slate-500/15 text-slate-400 border border-slate-500/20",
  Matured: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  "Premature Closed": "bg-red-500/15 text-red-400 border border-red-500/20",
  Purchase: "bg-green-500/15 text-green-400 border border-green-500/20",
  Redemption: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  Buy: "bg-green-500/15 text-green-400 border border-green-500/20",
  Sell: "bg-red-500/15 text-red-400 border border-red-500/20",
  Low: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  Moderate: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  High: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  "Very High": "bg-red-500/15 text-red-400 border border-red-500/20",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        statusStyles[status] || "bg-slate-500/15 text-slate-400 border border-slate-500/20"
      )}
    >
      {status}
    </span>
  );
}

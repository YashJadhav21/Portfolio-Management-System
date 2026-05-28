"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileBarChart, Download, RefreshCw } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { investorPortalService } from "@/services/investor-api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

function exportToCSV(data, filename) {
  if (!data || data.length === 0) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => {
    const val = row[h];
    if (val === null || val === undefined) return "";
    if (typeof val === "object") return JSON.stringify(val);
    return `"${String(val).replace(/"/g, '""')}"`;
  }).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${filename}.csv`);
}

function ReportTable({ columns, data, loading }) {
  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          {columns.map((_, j) => <div key={j} className="h-8 bg-slate-800 rounded flex-1" />)}
        </div>
      ))}
    </div>
  );
  if (!data || data.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <FileBarChart className="w-12 h-12 mb-3 text-slate-700" />
      <p className="text-sm">No data found</p>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const REPORTS = [
  { id: "fd-maturity", label: "FD Maturity Report", description: "Your fixed deposits sorted by maturity date", icon: "📅" },
  { id: "profit-loss", label: "Profit & Loss", description: "Realized P&L from your MF redemptions and share sales", icon: "💹" },
  { id: "mf-holdings", label: "MF Holdings", description: "Your current mutual fund holdings with net units", icon: "📊" },
  { id: "share-holdings", label: "Share Holdings", description: "Your current share holdings and realized P&L", icon: "📈" },
];

const COLUMNS = {
  "fd-maturity": [
    { key: "bankName", label: "Bank" },
    { key: "fdNumber", label: "FD #" },
    { key: "amount", label: "Amount", render: (v) => formatCurrency(v) },
    { key: "interestRate", label: "Rate", render: (v) => `${v}%` },
    { key: "tenureMonths", label: "Tenure", render: (v) => `${v} mo` },
    { key: "maturityAmount", label: "Maturity Amt", render: (v) => <span className="text-emerald-400 font-semibold">{formatCurrency(v)}</span> },
    { key: "maturityDate", label: "Maturity Date", render: (v) => formatDate(v) },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
  ],
  "profit-loss": [
    { key: "mfPurchased", label: "MF Purchased", render: (v) => formatCurrency(v) },
    { key: "mfRedeemed", label: "MF Redeemed", render: (v) => formatCurrency(v) },
    { key: "mfPnL", label: "MF P&L", render: (v) => <span className={v >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span> },
    { key: "sharesPnL", label: "Shares P&L", render: (v) => <span className={v >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span> },
    { key: "totalPnL", label: "Total P&L", render: (v) => <span className={`font-bold text-lg ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span> },
  ],
  "mf-holdings": [
    { key: "amc", label: "AMC", render: (v) => v?.name || "—" },
    { key: "scheme", label: "Scheme", render: (v) => <span className="text-xs">{v?.name || "—"}</span> },
    { key: "netUnits", label: "Net Units", render: (v) => v?.toFixed(4) },
    { key: "totalInvested", label: "Invested", render: (v) => formatCurrency(v) },
    { key: "currentValue", label: "Current Value", render: (v) => <span className="font-semibold text-blue-400">{formatCurrency(v)}</span> },
    { key: "_gl", label: "Gain/Loss", render: (_, row) => { const g = (row.currentValue || 0) - (row.totalInvested || 0); return <span className={g >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{g >= 0 ? "+" : ""}{formatCurrency(g)}</span>; } },
  ],
  "share-holdings": [
    { key: "company", label: "Scrip / Company", render: (v) => <span className="font-semibold text-blue-400">{v?.name || "—"}</span> },
    { key: "exchange", label: "Exchange", render: (v) => <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${v === "BSE" ? "text-orange-400 bg-orange-500/10" : "text-blue-400 bg-blue-500/10"}`}>{v}</span> },
    { key: "netQuantity", label: "Net Shares", render: (v) => <span className="font-bold text-slate-100">{Number(v).toLocaleString("en-IN")}</span> },
    { key: "avgBuyPrice", label: "Avg Buy Price", render: (v) => formatCurrency(v) },
    { key: "totalBuyAmount", label: "Total Invested", render: (v) => formatCurrency(v) },
    { key: "realizedPnL", label: "Realized P&L", render: (v) => <span className={v >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span> },
  ],
};

async function fetchReport(id, params, service) {
  switch (id) {
    case "fd-maturity": return (await service.getFDMaturity(params)).data.data;
    case "profit-loss": {
      const res = await service.getProfitLoss();
      return [res.data.data]; // single object → wrap in array for table
    }
    case "mf-holdings": return (await service.getMFHoldings()).data.data;
    case "share-holdings": return (await service.getShareHoldings()).data.data;
    default: return [];
  }
}

export default function InvestorReportsPage() {
  const [activeReport, setActiveReport] = useState("fd-maturity");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fdStatus, setFdStatus] = useState("");
  const [fdFrom, setFdFrom] = useState("");
  const [fdTo, setFdTo] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true); setData([]);
    try {
      const params = activeReport === "fd-maturity" ? { status: fdStatus, from: fdFrom, to: fdTo } : {};
      const result = await fetchReport(activeReport, params, investorPortalService);
      setData(result || []);
    } catch (e) {
      toast.error("Failed to load report: " + (e.response?.data?.message || e.message));
    } finally { setLoading(false); }
  }, [activeReport, fdStatus, fdFrom, fdTo]);

  useEffect(() => { loadReport(); }, [activeReport]);

  const activeReportMeta = REPORTS.find((r) => r.id === activeReport);
  const columns = COLUMNS[activeReport] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Reports"
        description="View and export your portfolio reports"
        actions={
          <div className="flex gap-2">
            <button onClick={loadReport} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => exportToCSV(data, activeReport)} disabled={!data.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        }
      />

      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="lg:w-64 shrink-0">
          <div className="glass-card rounded-2xl p-3 space-y-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">Report Types</p>
            {REPORTS.map((r) => (
              <button key={r.id} onClick={() => setActiveReport(r.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${activeReport === r.id
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"}`}>
                <span className="text-lg">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <span className="text-2xl">{activeReportMeta?.icon}</span>
                  {activeReportMeta?.label}
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">{activeReportMeta?.description}</p>
              </div>
              {data.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 text-center shrink-0">
                  <p className="text-emerald-400 font-bold text-xl">{data.length}</p>
                  <p className="text-slate-400 text-xs">Records</p>
                </div>
              )}
            </div>

            {activeReport === "fd-maturity" && (
              <div className="flex flex-wrap gap-3 mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                  <select value={fdStatus} onChange={(e) => setFdStatus(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Matured">Matured</option>
                    <option value="Premature Closed">Premature Closed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">From Date</label>
                  <input type="date" value={fdFrom} onChange={(e) => setFdFrom(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">To Date</label>
                  <input type="date" value={fdTo} onChange={(e) => setFdTo(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex items-end">
                  <button onClick={loadReport} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors">Apply Filter</button>
                </div>
              </div>
            )}

            <ReportTable columns={columns} data={data} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

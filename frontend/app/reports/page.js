"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileBarChart, Download, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { reportService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

// --- CSV Export Utility ---
function exportToCSV(data, filename) {
  if (!data || data.length === 0) { toast.error("No data to export"); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${filename}.csv`);
}

// --- Report Table Component ---
function ReportTable({ columns, data, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            {columns.map((_, j) => (
              <div key={j} className="h-8 bg-slate-800 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <FileBarChart className="w-12 h-12 mb-3 text-slate-700" />
        <p className="text-sm">No data found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/50 table-row-hover">
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

// ===== Report Definitions =====

const REPORTS = [
  {
    id: "investor-portfolio",
    label: "Investor Portfolio",
    description: "Complete portfolio summary per investor across all asset classes",
    icon: "👤",
  },
  {
    id: "amc-wise",
    label: "AMC-wise Report",
    description: "Mutual fund investments grouped by Asset Management Company",
    icon: "🏦",
  },
  {
    id: "fd-maturity",
    label: "FD Maturity Report",
    description: "Fixed deposits sorted by maturity date with status filter",
    icon: "📅",
  },
  {
    id: "mf-holdings",
    label: "MF Holdings",
    description: "Current mutual fund holdings with net units and current value",
    icon: "📊",
  },
  {
    id: "profit-loss",
    label: "Profit & Loss",
    description: "Realized P&L from mutual fund redemptions and share sales",
    icon: "💹",
  },
  {
    id: "asset-allocation",
    label: "Asset Allocation",
    description: "Portfolio split across Fixed Deposits, Mutual Funds, and Shares",
    icon: "🥧",
  },
];

// Column definitions per report
const COLUMNS = {
  "investor-portfolio": [
    { key: "name", label: "Investor" },
    { key: "group", label: "Group" },
    { key: "pan", label: "PAN" },
    { key: "fdInvested", label: "FD Amount", render: (v) => formatCurrency(v) },
    { key: "fdMaturity", label: "FD Maturity", render: (v) => formatCurrency(v) },
    { key: "mfInvested", label: "MF Net", render: (v) => formatCurrency(v) },
    { key: "sharesInvested", label: "Shares Net", render: (v) => formatCurrency(v) },
    { key: "totalPortfolio", label: "Total Portfolio", render: (v) => <span className="font-bold text-blue-400">{formatCurrency(v)}</span> },
  ],
  "amc-wise": [
    { key: "amc", label: "AMC", render: (v) => v?.name || "—" },
    { key: "txCount", label: "Transactions" },
    { key: "totalPurchased", label: "Purchased", render: (v) => formatCurrency(v) },
    { key: "totalRedeemed", label: "Redeemed", render: (v) => formatCurrency(v) },
    { key: "netInvested", label: "Net Invested", render: (v) => <span className="font-semibold text-emerald-400">{formatCurrency(v)}</span> },
    { key: "totalUnits", label: "Total Units", render: (v) => v?.toFixed(4) },
  ],
  "fd-maturity": [
    { key: "investorId", label: "Investor", render: (v) => v?.name || "—" },
    { key: "bankName", label: "Bank" },
    { key: "fdNumber", label: "FD #" },
    { key: "amount", label: "Amount", render: (v) => formatCurrency(v) },
    { key: "interestRate", label: "Rate", render: (v) => `${v}%` },
    { key: "tenureMonths", label: "Tenure", render: (v) => `${v} mo` },
    { key: "maturityAmount", label: "Maturity Amt", render: (v) => <span className="text-emerald-400 font-semibold">{formatCurrency(v)}</span> },
    { key: "interestEarned", label: "Interest", render: (v) => formatCurrency(v) },
    { key: "maturityDate", label: "Maturity Date", render: (v) => formatDate(v) },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={v} /> },
  ],
  "mf-holdings": [
    { key: "investor", label: "Investor", render: (v) => v?.name || "—" },
    { key: "amc", label: "AMC", render: (v) => v?.name || "—" },
    { key: "scheme", label: "Scheme", render: (v) => <span className="text-xs">{v?.name || "—"}</span> },
    { key: "netUnits", label: "Net Units", render: (v) => v?.toFixed(4) },
    { key: "totalInvested", label: "Invested", render: (v) => formatCurrency(v) },
    { key: "currentValue", label: "Current Value", render: (v) => <span className="font-semibold text-blue-400">{formatCurrency(v)}</span> },
    {
      key: "_gainLoss",
      label: "Gain/Loss",
      render: (_, row) => {
        const g = (row.currentValue || 0) - (row.totalInvested || 0);
        return <span className={g >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{g >= 0 ? "+" : ""}{formatCurrency(g)}</span>;
      },
    },
  ],
  "profit-loss": [
    { key: "investor", label: "Investor" },
    { key: "mfPurchased", label: "MF Purchased", render: (v) => formatCurrency(v) },
    { key: "mfRedeemed", label: "MF Redeemed", render: (v) => formatCurrency(v) },
    { key: "mfPnL", label: "MF P&L", render: (v) => <span className={v >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span> },
    { key: "sharesPnL", label: "Shares P&L", render: (v) => <span className={v >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span> },
    { key: "totalPnL", label: "Total P&L", render: (v) => <span className={`font-bold text-lg ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>{v >= 0 ? "+" : ""}{formatCurrency(v)}</span> },
  ],
  "asset-allocation": [
    { key: "asset", label: "Asset Class" },
    { key: "amount", label: "Amount", render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: "percentage", label: "Allocation %", render: (v) => (
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-slate-800 rounded-full h-2 max-w-[120px]">
          <div className="h-2 rounded-full bg-blue-500" style={{ width: `${v}%` }} />
        </div>
        <span className="text-blue-400 font-semibold">{v}%</span>
      </div>
    )},
  ],
};

// Fetch functions
async function fetchReport(id, params) {
  switch (id) {
    case "investor-portfolio": return (await reportService.investorPortfolio()).data.data;
    case "amc-wise": return (await reportService.amcWise()).data.data;
    case "fd-maturity": return (await reportService.fdMaturity(params)).data.data;
    case "mf-holdings": return (await reportService.mfHoldings()).data.data;
    case "profit-loss": return (await reportService.profitLoss()).data.data;
    case "asset-allocation": return (await reportService.assetAllocation()).data.data;
    default: return [];
  }
}

// CSV flatten helpers
function flattenForCSV(reportId, data) {
  switch (reportId) {
    case "investor-portfolio":
      return data.map((r) => ({ Investor: r.name, Group: r.group, PAN: r.pan, FD_Amount: r.fdInvested, FD_Maturity: r.fdMaturity, MF_Net: r.mfInvested, Shares_Net: r.sharesInvested, Total: r.totalPortfolio }));
    case "amc-wise":
      return data.map((r) => ({ AMC: r.amc?.name, Transactions: r.txCount, Purchased: r.totalPurchased, Redeemed: r.totalRedeemed, Net: r.netInvested }));
    case "fd-maturity":
      return data.map((r) => ({ Investor: r.investorId?.name, Bank: r.bankName, FD_Number: r.fdNumber, Amount: r.amount, Rate: r.interestRate, Tenure: r.tenureMonths, Maturity_Amount: r.maturityAmount, Interest: r.interestEarned, Maturity_Date: formatDate(r.maturityDate), Status: r.status }));
    case "mf-holdings":
      return data.map((r) => ({ Investor: r.investor?.name, AMC: r.amc?.name, Scheme: r.scheme?.name, Net_Units: r.netUnits, Invested: r.totalInvested, Current_Value: r.currentValue }));
    case "profit-loss":
      return data.map((r) => ({ Investor: r.investor, MF_Purchased: r.mfPurchased, MF_Redeemed: r.mfRedeemed, MF_PnL: r.mfPnL, Shares_PnL: r.sharesPnL, Total_PnL: r.totalPnL }));
    case "asset-allocation":
      return data;
    default:
      return data;
  }
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("investor-portfolio");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fdStatus, setFdStatus] = useState("");
  const [fdFrom, setFdFrom] = useState("");
  const [fdTo, setFdTo] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setData([]);
    try {
      const params = activeReport === "fd-maturity" ? { status: fdStatus, from: fdFrom, to: fdTo } : {};
      const result = await fetchReport(activeReport, params);
      setData(result || []);
    } catch (e) {
      toast.error("Failed to load report: " + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  }, [activeReport, fdStatus, fdFrom, fdTo]);

  useEffect(() => { loadReport(); }, [activeReport]);

  const activeReportMeta = REPORTS.find((r) => r.id === activeReport);
  const columns = COLUMNS[activeReport] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate, view, and export portfolio reports"
        actions={
          <div className="flex gap-2">
            <button onClick={loadReport} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              onClick={() => exportToCSV(flattenForCSV(activeReport, data), activeReport)}
              disabled={!data.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        }
      />

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Sidebar - Report Type Selector */}
        <div className="lg:w-64 shrink-0">
          <div className="glass-card rounded-2xl p-3 space-y-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 py-2">Report Types</p>
            {REPORTS.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveReport(r.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left ${activeReport === r.id
                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
              >
                <span className="text-lg">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Report Content */}
        <div className="flex-1 min-w-0">
          <div className="glass-card rounded-2xl p-5">
            {/* Report Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <span className="text-2xl">{activeReportMeta?.icon}</span>
                  {activeReportMeta?.label}
                </h2>
                <p className="text-slate-400 text-sm mt-0.5">{activeReportMeta?.description}</p>
              </div>
              {data.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 text-center shrink-0">
                  <p className="text-blue-400 font-bold text-xl">{data.length}</p>
                  <p className="text-slate-400 text-xs">Records</p>
                </div>
              )}
            </div>

            {/* FD Maturity Filters */}
            {activeReport === "fd-maturity" && (
              <div className="flex flex-wrap gap-3 mb-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Status</label>
                  <select value={fdStatus} onChange={(e) => setFdStatus(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Matured">Matured</option>
                    <option value="Premature Closed">Premature Closed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">From Date</label>
                  <input type="date" value={fdFrom} onChange={(e) => setFdFrom(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">To Date</label>
                  <input type="date" value={fdTo} onChange={(e) => setFdTo(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-end">
                  <button onClick={loadReport} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
                    Apply Filter
                  </button>
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

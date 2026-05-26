"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import DataTable from "@/components/tables/DataTable";

/**
 * Read-only master data table for investor portal.
 * Shows data from the shared API but without Add/Edit/Delete actions.
 */
export default function InvestorMasterTable({
  title,
  description,
  service,
  columns,
  searchPlaceholder = "Search...",
  icon: Icon,
}) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const res = await service.getAll({ page: p, limit: 15, search: s });
      setRecords(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) {
      console.error("Failed to load:", e);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-100">{title}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{description}</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(page, search)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-sm rounded-xl transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <p className="text-emerald-300 text-xs">
          This is a <strong>read-only</strong> reference view. Contact your portfolio manager to make changes to master data.
        </p>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl p-5">
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          totalRows={total}
          page={page}
          pageSize={15}
          onPageChange={(p) => { setPage(p); fetchData(p, search); }}
          onSearch={(s) => { setSearch(s); setPage(1); fetchData(1, s); }}
          searchPlaceholder={searchPlaceholder}
        />
      </div>
    </div>
  );
}

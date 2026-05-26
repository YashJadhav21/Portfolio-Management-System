"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import DataTable from "@/components/tables/DataTable";
import FormModal from "@/components/ui/FormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { shareService, investorService, companyService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  investorId: z.string().min(1, "Investor is required"),
  companyId: z.string().min(1, "Company is required"),
  transactionDate: z.string().min(1, "Date is required"),
  type: z.enum(["Buy", "Sell"]),
  exchange: z.enum(["BSE", "NSE"]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  brokerage: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

function ShareForm({ data, onSubmit, isLoading, onCancel }) {
  const [investors, setInvestors] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    Promise.all([
      investorService.getAll({ limit: 100 }),
      companyService.getAll({ limit: 100 }),
    ]).then(([inv, comp]) => {
      setInvestors(inv.data.data || []);
      setCompanies(comp.data.data || []);
    });
  }, []);

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      investorId: "", companyId: "",
      transactionDate: new Date().toISOString().split("T")[0],
      type: "Buy", exchange: "NSE", quantity: "", price: "", brokerage: 0, notes: "",
    },
  });

  const quantity = watch("quantity");
  const price = watch("price");
  const brokerage = watch("brokerage");
  const totalAmount = (Number(quantity) * Number(price)) + Number(brokerage || 0);

  useEffect(() => {
    if (data) {
      reset({
        investorId: data.investorId?._id || data.investorId || "",
        companyId: data.companyId?._id || data.companyId || "",
        transactionDate: data.transactionDate?.split("T")[0] || "",
        type: data.type, exchange: data.exchange || "NSE", quantity: data.quantity,
        price: data.price, brokerage: data.brokerage || 0, notes: data.notes || "",
      });
    } else {
      reset({
        investorId: "", companyId: "",
        transactionDate: new Date().toISOString().split("T")[0],
        type: "Buy", exchange: "NSE", quantity: "", price: "", brokerage: 0, notes: "",
      });
    }
  }, [data, reset]);

  const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Investor *</label>
          <select {...register("investorId")} className={ic}>
            <option value="">Select investor...</option>
            {investors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
          {errors.investorId && <p className="text-red-400 text-xs mt-1">{errors.investorId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Transaction Type *</label>
          <select {...register("type")} className={ic}>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Exchange *</label>
          <select {...register("exchange")} className={ic}>
            <option value="NSE">NSE (National Stock Exchange)</option>
            <option value="BSE">BSE (Bombay Stock Exchange)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Company / Stock *</label>
          <select {...register("companyId")} className={ic}>
            <option value="">Select company...</option>
            {companies.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.symbol})</option>)}
          </select>
          {errors.companyId && <p className="text-red-400 text-xs mt-1">{errors.companyId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Transaction Date *</label>
          <input {...register("transactionDate")} type="date" className={ic} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Quantity *</label>
          <input {...register("quantity")} type="number" className={ic} placeholder="e.g. 100" />
          {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Price per Share (₹) *</label>
          <input {...register("price")} type="number" step="0.01" className={ic} placeholder="e.g. 2800" />
          {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Brokerage (₹)</label>
          <input {...register("brokerage")} type="number" step="0.01" className={ic} placeholder="0" />
        </div>
        <div className="flex flex-col justify-end">
          {totalAmount > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">Total Amount</p>
              <p className="text-blue-400 font-bold text-xl">{formatCurrency(totalAmount)}</p>
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Notes</label>
        <textarea {...register("notes")} rows={2} className={`${ic} resize-none`} placeholder="Optional notes..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {data ? "Update" : "Record Trade"}
        </button>
      </div>
    </form>
  );
}

const txColumns = [
  { accessorKey: "transactionDate", header: "Date", cell: ({ getValue }) => formatDate(getValue()) },
  { accessorKey: "investorId", header: "Investor", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()?.name || "—"}</span> },
  { accessorKey: "companyId", header: "Company", cell: ({ getValue }) => (
    <div>
      <p className="text-slate-200 font-medium">{getValue()?.name || "—"}</p>
      <p className="text-slate-500 text-xs font-mono">{getValue()?.symbol}</p>
    </div>
  )},
  { accessorKey: "exchange", header: "Exchange", cell: ({ getValue }) => {
    const ex = getValue() || "—";
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${ex === "BSE" ? "text-orange-400 bg-orange-500/10" : "text-blue-400 bg-blue-500/10"}`}>{ex}</span>;
  }},
  { accessorKey: "type", header: "Type", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
  { accessorKey: "quantity", header: "Qty", cell: ({ getValue }) => <span className="font-mono">{getValue()}</span> },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => `₹${getValue()?.toFixed(2)}` },
  { accessorKey: "brokerage", header: "Brokerage", cell: ({ getValue }) => formatCurrency(getValue()) },
  { accessorKey: "totalAmount", header: "Total", cell: ({ getValue }) => <span className="font-semibold">{formatCurrency(getValue())}</span> },
];

const holdingColumns = [
  { accessorKey: "investor", header: "Investor", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()?.name}</span> },
  { accessorKey: "company", header: "Company", cell: ({ getValue }) => (
    <div>
      <p className="text-slate-200 font-medium">{getValue()?.name}</p>
      <p className="text-slate-500 text-xs font-mono">{getValue()?.symbol}</p>
    </div>
  )},
  { accessorKey: "company", id: "sector", header: "Sector", cell: ({ getValue }) => <span className="text-slate-400 text-xs">{getValue()?.sector || "—"}</span> },
  { accessorKey: "netQuantity", header: "Net Qty", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold">{getValue()}</span> },
  { accessorKey: "avgBuyPrice", header: "Avg. Buy Price", cell: ({ getValue }) => `₹${getValue()?.toFixed(2)}` },
  { accessorKey: "totalBuyAmount", header: "Total Invested", cell: ({ getValue }) => formatCurrency(getValue()) },
  {
    id: "gainLoss",
    header: "Realized P&L",
    cell: ({ row }) => {
      const pnl = row.original.realizedPnL || 0;
      return <span className={pnl >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
      </span>;
    },
  },
];

export default function SharesPage() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [records, setRecords] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const totalBought = records.filter((r) => r.type === "Buy").reduce((s, r) => s + r.totalAmount, 0);
  const totalSold = records.filter((r) => r.type === "Sell").reduce((s, r) => s + r.totalAmount, 0);
  const totalRealizedPnL = holdings.reduce((s, h) => s + (h.realizedPnL || 0), 0);

  const fetchTransactions = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const res = await shareService.getAll({ page: p, limit: 10, search: s });
      setRecords(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load transactions"); }
    finally { setLoading(false); }
  }, []);

  const fetchHoldings = useCallback(async () => {
    setHoldingsLoading(true);
    try {
      const res = await shareService.getHoldings();
      setHoldings(res.data.data);
    } catch { toast.error("Failed to load holdings"); }
    finally { setHoldingsLoading(false); }
  }, []);

  useEffect(() => { fetchTransactions(); fetchHoldings(); }, [fetchTransactions, fetchHoldings]);

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editRecord) { await shareService.update(editRecord._id, data); toast.success("Updated!"); }
      else { await shareService.create(data); toast.success("Trade recorded!"); }
      setModalOpen(false);
      fetchTransactions(page, search);
      fetchHoldings();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await shareService.delete(deleteId);
      toast.success("Deleted!");
      setDeleteOpen(false);
      fetchTransactions(page, search);
      fetchHoldings();
    } catch { toast.error("Delete failed"); }
    finally { setDeleteLoading(false); }
  };

  const actionColumn = {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditRecord(row.original); setModalOpen(true); }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => { setDeleteId(row.original._id); setDeleteOpen(true); }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shares"
        description="Track equity trades, portfolio holdings and P&L"
        actions={
          <button onClick={() => { setEditRecord(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add Trade
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card-blue rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <p className="text-slate-400 text-sm">Total Bought</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalBought)}</p>
        </div>
        <div className="stat-card-rose rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <p className="text-slate-400 text-sm">Total Sold</p>
          </div>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalSold)}</p>
        </div>
        <div className={`${totalRealizedPnL >= 0 ? "stat-card-emerald" : "stat-card-rose"} rounded-2xl p-5`}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <p className="text-slate-400 text-sm">Realized P&L</p>
          </div>
          <p className={`text-2xl font-bold ${totalRealizedPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalRealizedPnL >= 0 ? "+" : ""}{formatCurrency(totalRealizedPnL)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {["transactions", "holdings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all capitalize ${activeTab === tab
              ? "bg-blue-600/20 text-blue-400 border-b-2 border-blue-500"
              : "text-slate-400 hover:text-slate-200"
              }`}
          >
            {tab === "transactions" ? "All Trades" : "Portfolio Holdings"}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        {activeTab === "transactions" ? (
          <DataTable
            columns={[...txColumns, actionColumn]}
            data={records} loading={loading} totalRows={total}
            page={page} pageSize={10}
            onPageChange={(p) => { setPage(p); fetchTransactions(p, search); }}
            onSearch={(s) => { setSearch(s); setPage(1); fetchTransactions(1, s); }}
            searchPlaceholder="Search trades..."
          />
        ) : (
          <DataTable
            columns={holdingColumns}
            data={holdings} loading={holdingsLoading}
            totalRows={holdings.length} page={1} pageSize={holdings.length || 10}
            searchPlaceholder="Search holdings..."
          />
        )}
      </div>

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editRecord ? "Edit Trade" : "Record Share Trade"} size="lg">
        <ShareForm data={editRecord} onSubmit={handleFormSubmit} isLoading={formLoading} onCancel={() => setModalOpen(false)} />
      </FormModal>

      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}

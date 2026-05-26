"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import DataTable from "@/components/tables/DataTable";
import FormModal from "@/components/ui/FormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { investorPortalService } from "@/services/investor-api.service";
import { amcService, schemeService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  amcId: z.string().min(1, "AMC is required"),
  schemeId: z.string().min(1, "Scheme is required"),
  transactionDate: z.string().min(1, "Date is required"),
  type: z.enum(["Purchase", "Redemption"]),
  units: z.coerce.number().positive("Units must be positive"),
  nav: z.coerce.number().positive("NAV must be positive"),
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().optional(),
});

function MFForm({ data, onSubmit, isLoading, onCancel }) {
  const [amcs, setAmcs] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amcId: "", schemeId: "",
      transactionDate: new Date().toISOString().split("T")[0],
      type: "Purchase", units: "", nav: "", amount: "", notes: "",
    },
  });

  useEffect(() => {
    amcService.getAll({ limit: 100 }).then((r) => setAmcs(r.data.data || []));
  }, []);

  const watchedAmc = watch("amcId");
  const units = watch("units");
  const nav = watch("nav");

  useEffect(() => {
    if (watchedAmc) {
      schemeService.getAll({ limit: 200 }).then((r) => {
        setSchemes((r.data.data || []).filter((s) => (s.amcId?._id || s.amcId) === watchedAmc));
      });
      setValue("schemeId", "");
    }
  }, [watchedAmc, setValue]);

  useEffect(() => {
    if (units && nav) setValue("amount", parseFloat((Number(units) * Number(nav)).toFixed(2)));
  }, [units, nav, setValue]);

  useEffect(() => {
    if (data) {
      reset({
        amcId: data.amcId?._id || data.amcId || "",
        schemeId: data.schemeId?._id || data.schemeId || "",
        transactionDate: data.transactionDate?.split("T")[0] || "",
        type: data.type, units: data.units, nav: data.nav, amount: data.amount, notes: data.notes || "",
      });
    } else {
      reset({ amcId: "", schemeId: "", transactionDate: new Date().toISOString().split("T")[0], type: "Purchase", units: "", nav: "", amount: "", notes: "" });
    }
  }, [data, reset]);

  const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Transaction Type *</label>
          <select {...register("type")} className={ic}>
            <option value="Purchase">Purchase (Buy)</option>
            <option value="Redemption">Redemption (Sell)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">AMC *</label>
          <select {...register("amcId")} className={ic}>
            <option value="">Select AMC...</option>
            {amcs.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
          {errors.amcId && <p className="text-red-400 text-xs mt-1">{errors.amcId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Scheme *</label>
          <select {...register("schemeId")} className={ic}>
            <option value="">Select scheme...</option>
            {schemes.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          {errors.schemeId && <p className="text-red-400 text-xs mt-1">{errors.schemeId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Transaction Date *</label>
          <input {...register("transactionDate")} type="date" className={ic} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">NAV (₹) *</label>
          <input {...register("nav")} type="number" step="0.0001" className={ic} />
          {errors.nav && <p className="text-red-400 text-xs mt-1">{errors.nav.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Units *</label>
          <input {...register("units")} type="number" step="0.0001" className={ic} placeholder="e.g. 100.5" />
          {errors.units && <p className="text-red-400 text-xs mt-1">{errors.units.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Amount (₹) *</label>
          <input {...register("amount")} type="number" step="0.01" className={ic} />
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Notes</label>
        <textarea {...register("notes")} rows={2} className={`${ic} resize-none`} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {data ? "Update" : "Record Transaction"}
        </button>
      </div>
    </form>
  );
}

const txColumns = [
  { accessorKey: "transactionDate", header: "Date", cell: ({ getValue }) => formatDate(getValue()) },
  { accessorKey: "amcId", header: "AMC", cell: ({ getValue }) => getValue()?.name || "—" },
  { accessorKey: "schemeId", header: "Scheme", cell: ({ getValue }) => <span className="text-xs">{getValue()?.name || "—"}</span> },
  { accessorKey: "type", header: "Type", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
  { accessorKey: "units", header: "Units", cell: ({ getValue }) => getValue()?.toFixed(4) },
  { accessorKey: "nav", header: "NAV", cell: ({ getValue }) => `₹${getValue()?.toFixed(4)}` },
  { accessorKey: "amount", header: "Amount", cell: ({ getValue }) => <span className="font-semibold">{formatCurrency(getValue())}</span> },
];

const holdingColumns = [
  { accessorKey: "scheme", header: "Scheme", cell: ({ getValue }) => <span className="text-xs">{getValue()?.name}</span> },
  { accessorKey: "amc", header: "AMC", cell: ({ getValue }) => getValue()?.name || "—" },
  { accessorKey: "netUnits", header: "Net Units", cell: ({ getValue }) => <span className="font-mono text-blue-400">{getValue()?.toFixed(4)}</span> },
  { accessorKey: "totalInvested", header: "Invested", cell: ({ getValue }) => formatCurrency(getValue()) },
  { accessorKey: "currentValue", header: "Current Value", cell: ({ getValue }) => <span className="text-emerald-400 font-semibold">{formatCurrency(getValue())}</span> },
  {
    id: "gainLoss", header: "Gain/Loss",
    cell: ({ row }) => {
      const g = (row.original.currentValue || 0) - (row.original.totalInvested || 0);
      return <span className={g >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{g >= 0 ? "+" : ""}{formatCurrency(g)}</span>;
    },
  },
];

export default function InvestorMFPage() {
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

  const totalInvested = records.filter((r) => r.type === "Purchase").reduce((s, r) => s + r.amount, 0);
  const totalRedeemed = records.filter((r) => r.type === "Redemption").reduce((s, r) => s + r.amount, 0);

  const fetchTx = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const res = await investorPortalService.getMF({ page: p, limit: 10, search: s });
      setRecords(res.data.data); setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load transactions"); }
    finally { setLoading(false); }
  }, []);

  const fetchHoldings = useCallback(async () => {
    setHoldingsLoading(true);
    try {
      const res = await investorPortalService.getMFHoldings();
      setHoldings(res.data.data);
    } catch { toast.error("Failed to load holdings"); }
    finally { setHoldingsLoading(false); }
  }, []);

  useEffect(() => { fetchTx(); fetchHoldings(); }, [fetchTx, fetchHoldings]);

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editRecord) { await investorPortalService.updateMF(editRecord._id, data); toast.success("Updated!"); }
      else { await investorPortalService.createMF(data); toast.success("Transaction recorded!"); }
      setModalOpen(false); fetchTx(page, search); fetchHoldings();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await investorPortalService.deleteMF(deleteId);
      toast.success("Deleted!"); setDeleteOpen(false); fetchTx(page, search); fetchHoldings();
    } catch { toast.error("Delete failed"); }
    finally { setDeleteLoading(false); }
  };

  const actionColumn = {
    id: "actions", header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <button onClick={() => { setEditRecord(row.original); setModalOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setDeleteId(row.original._id); setDeleteOpen(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mutual Funds" description="Manage your mutual fund purchases and redemptions"
        actions={<button onClick={() => { setEditRecord(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4" /> Add Transaction</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5"><p className="text-slate-400 text-sm mb-2">Total Purchased</p><p className="text-2xl font-bold text-slate-100">{formatCurrency(totalInvested)}</p></div>
        <div className="glass-card rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5"><p className="text-slate-400 text-sm mb-2">Total Redeemed</p><p className="text-2xl font-bold text-slate-100">{formatCurrency(totalRedeemed)}</p></div>
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5"><p className="text-slate-400 text-sm mb-2">Net Holdings Value</p><p className="text-2xl font-bold text-slate-100">{formatCurrency(holdings.reduce((s, h) => s + (h.currentValue || 0), 0))}</p></div>
      </div>

      <div className="flex gap-2 border-b border-slate-800">
        {["transactions", "holdings"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all capitalize ${activeTab === tab ? "bg-emerald-600/20 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-200"}`}>
            {tab === "transactions" ? "All Transactions" : "Holdings"}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        {activeTab === "transactions" ? (
          <DataTable columns={[...txColumns, actionColumn]} data={records} loading={loading} totalRows={total} page={page} pageSize={10}
            onPageChange={(p) => { setPage(p); fetchTx(p, search); }} onSearch={(s) => { setSearch(s); setPage(1); fetchTx(1, s); }} searchPlaceholder="Search transactions..." />
        ) : (
          <DataTable columns={holdingColumns} data={holdings} loading={holdingsLoading} totalRows={holdings.length} page={1} pageSize={holdings.length || 10} searchPlaceholder="Search holdings..." />
        )}
      </div>

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? "Edit MF Transaction" : "Add MF Transaction"} size="xl">
        <MFForm data={editRecord} onSubmit={handleFormSubmit} isLoading={formLoading} onCancel={() => setModalOpen(false)} />
      </FormModal>
      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}

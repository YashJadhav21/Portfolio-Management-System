"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/tables/DataTable";
import FormModal from "@/components/ui/FormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { investorPortalService } from "@/services/investor-api.service";
import { amcService, schemeService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

/* ── Schema — exact fields from screenshot ─────────────────── */
const schema = z.object({
  effectiveDate:    z.string().min(1, "Effective Date is required"),
  amcId:            z.string().min(1, "AMC is required"),
  amcType:          z.string().optional(),
  schemeId:         z.string().min(1, "Scheme is required"),
  type:             z.enum(["Purchase", "Redemption"]),
  mfType:           z.enum(["Dividend", "Growth"]),
  jointHolder1:     z.string().optional(),
  jointHolder2:     z.string().optional(),
  amount:           z.coerce.number().positive("Amount Invested is required"),
  firstDividendDate:z.string().optional(),
  nav:              z.coerce.number().min(0),
  units:            z.coerce.number().min(0),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

/* ── Form ──────────────────────────────────────────────────── */
function MFForm({ data, onSubmit, isLoading, onCancel }) {
  const [amcs, setAmcs] = useState([]);
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    amcService.getAll({ limit: 200 }).then((r) => setAmcs(r.data.data || []));
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      effectiveDate: new Date().toISOString().split("T")[0],
      amcId: "", amcType: "", schemeId: "", type: "Purchase",
      mfType: "Growth", jointHolder1: "", jointHolder2: "",
      amount: "", firstDividendDate: "", nav: "", units: "",
    },
  });

  const watchedAmcId = watch("amcId");

  useEffect(() => {
    if (watchedAmcId) {
      schemeService.getAll({ limit: 200 }).then((r) => {
        setSchemes((r.data.data || []).filter((s) => (s.amcId?._id || s.amcId) === watchedAmcId));
      });
      setValue("schemeId", "");
    }
  }, [watchedAmcId, setValue]);

  const handleSchemeChange = (e) => {
    const scheme = schemes.find((s) => s._id === e.target.value);
    if (scheme?.nav) setValue("nav", scheme.nav);
  };

  useEffect(() => {
    if (data) {
      if (data.amcId?._id || data.amcId) {
        schemeService.getAll({ limit: 200 }).then((r) => {
          setSchemes((r.data.data || []).filter((s) => (s.amcId?._id || s.amcId) === (data.amcId?._id || data.amcId)));
        });
      }
      reset({
        effectiveDate: data.effectiveDate?.split("T")[0] || "",
        amcId: data.amcId?._id || data.amcId || "",
        amcType: data.amcType || "",
        schemeId: data.schemeId?._id || data.schemeId || "",
        type: data.type || "Purchase",
        mfType: data.mfType || "Growth",
        jointHolder1: data.jointHolder1 || "",
        jointHolder2: data.jointHolder2 || "",
        amount: data.amount || "",
        firstDividendDate: data.firstDividendDate?.split("T")[0] || "",
        nav: data.nav || "",
        units: data.units || "",
      });
    } else {
      reset({
        effectiveDate: new Date().toISOString().split("T")[0],
        amcId: "", amcType: "", schemeId: "", type: "Purchase",
        mfType: "Growth", jointHolder1: "", jointHolder2: "",
        amount: "", firstDividendDate: "", nav: "", units: "",
      });
    }
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Effective Date */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Effective Date *</label>
          <input {...register("effectiveDate")} type="date" className={ic} />
          {errors.effectiveDate && <p className="text-red-400 text-xs mt-1">{errors.effectiveDate.message}</p>}
        </div>

        {/* Transaction Type */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Transaction Type *</label>
          <select {...register("type")} className={ic}>
            <option value="Purchase">Purchase</option>
            <option value="Redemption">Redemption</option>
          </select>
        </div>

        {/* AMC Code */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">AMC Code *</label>
          <select {...register("amcId")} className={ic}>
            <option value="">Select AMC / Company / Bank Name...</option>
            {amcs.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
          {errors.amcId && <p className="text-red-400 text-xs mt-1">{errors.amcId.message}</p>}
        </div>

        {/* AMC Type */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">AMC Type</label>
          <input {...register("amcType")} className={ic} placeholder="e.g. Equity, Debt, Hybrid..." />
        </div>

        {/* Scheme Code */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Scheme Code *</label>
          <select {...register("schemeId")} onChange={handleSchemeChange} className={ic}>
            <option value="">Select Scheme Name...</option>
            {schemes.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          {errors.schemeId && <p className="text-red-400 text-xs mt-1">{errors.schemeId.message}</p>}
        </div>

        {/* Type of Mutual Fund */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Type of Mutual Fund</label>
          <select {...register("mfType")} className={ic}>
            <option value="Dividend">Dividend</option>
            <option value="Growth">Growth</option>
          </select>
        </div>

        {/* Joint Holder 1 */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Joint Holder 1</label>
          <input {...register("jointHolder1")} className={ic} placeholder="Actual Joint Holder 1 Name" />
        </div>

        {/* Joint Holder 2 */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Joint Holder 2</label>
          <input {...register("jointHolder2")} className={ic} placeholder="Actual Joint Holder 2 Name" />
        </div>

        {/* Amount Invested */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Amount Invested *</label>
          <input {...register("amount")} type="number" step="0.01" className={ic} placeholder="₹ 0.00" />
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        {/* First Dividend Date */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">First Dividend Date</label>
          <input {...register("firstDividendDate")} type="date" className={ic} />
        </div>

        {/* NAV */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">NAV</label>
          <input {...register("nav")} type="number" step="0.0001" className={ic} placeholder="Auto-filled from scheme" />
        </div>

        {/* Units */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Units</label>
          <input {...register("units")} type="number" step="0.0001" className={ic} placeholder="0.0000" />
        </div>
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

/* ── Table columns ─────────────────────────────────────────── */
const txColumns = [
  { accessorKey: "effectiveDate", header: "Effective Date", cell: ({ getValue }) => <span className="font-semibold text-slate-200">{formatDate(getValue())}</span> },
  { accessorKey: "amcId", header: "AMC Code", cell: ({ getValue }) => <span className="font-semibold text-blue-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "amcType", header: "AMC Type", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "schemeId", header: "Scheme Code", cell: ({ getValue }) => <span className="text-slate-300 text-xs max-w-[160px] truncate block">{getValue()?.name || "—"}</span> },
  { accessorKey: "type", header: "Type", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
  { accessorKey: "mfType", header: "MF Type", cell: ({ getValue }) => <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${getValue() === "Dividend" ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>{getValue() || "Growth"}</span> },
  { accessorKey: "amount", header: "Amount Invested", cell: ({ getValue }) => <span className="font-bold text-slate-100">{formatCurrency(getValue())}</span> },
  { accessorKey: "nav", header: "NAV", cell: ({ getValue }) => getValue() ? `₹${Number(getValue()).toFixed(4)}` : "—" },
  { accessorKey: "units", header: "Units", cell: ({ getValue }) => getValue() ? Number(getValue()).toFixed(4) : "—" },
];

/* ── Page ──────────────────────────────────────────────────── */
export default function InvestorMFPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
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
      setRecords(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load transactions"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editRecord) { await investorPortalService.updateMF(editRecord._id, data); toast.success("Updated!"); }
      else { await investorPortalService.createMF(data); toast.success("Transaction recorded!"); }
      setModalOpen(false);
      fetchTx(page, search);
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await investorPortalService.deleteMF(deleteId);
      toast.success("Deleted!");
      setDeleteOpen(false);
      fetchTx(page, search);
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
      <PageHeader title="Mutual Funds — Purchase / Redemption" description="Manage your mutual fund purchases and redemptions"
        actions={<button onClick={() => { setEditRecord(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4" /> Add Transaction</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5">
          <p className="text-slate-400 text-sm mb-2">Total Purchased</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5">
          <p className="text-slate-400 text-sm mb-2">Total Redeemed</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalRedeemed)}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <DataTable columns={[...txColumns, actionColumn]} data={records} loading={loading} totalRows={total}
          page={page} pageSize={10}
          onPageChange={(p) => { setPage(p); fetchTx(p, search); }}
          onSearch={(s) => { setSearch(s); setPage(1); fetchTx(1, s); }}
          searchPlaceholder="Search transactions..." />
      </div>

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? "Edit MF Transaction" : "Add MF Transaction"} size="xl">
        <MFForm data={editRecord} onSubmit={handleFormSubmit} isLoading={formLoading} onCancel={() => setModalOpen(false)} />
      </FormModal>
      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}

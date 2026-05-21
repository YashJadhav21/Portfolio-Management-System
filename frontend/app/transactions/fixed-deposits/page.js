"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Calculator, TrendingUp, Banknote, Clock } from "lucide-react";
import DataTable from "@/components/tables/DataTable";
import FormModal from "@/components/ui/FormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { fdService, investorService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  investorId: z.string().min(1, "Investor is required"),
  bankName: z.string().min(1, "Bank name is required"),
  fdNumber: z.string().optional(),
  effectiveDate: z.string().min(1, "Effective date is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  interestRate: z.coerce.number().positive("Rate must be positive").max(100),
  tenureMonths: z.coerce.number().int().positive("Tenure must be positive"),
  maturityDate: z.string().min(1, "Maturity date is required"),
  interestFrequency: z.enum(["Monthly", "Quarterly", "Half-Yearly", "Yearly", "On Maturity"]),
  status: z.enum(["Active", "Matured", "Premature Closed"]),
  notes: z.string().optional(),
});

// Auto-calculate maturity date from effective date + tenure
function calcMaturityDate(effectiveDate, tenureMonths) {
  if (!effectiveDate || !tenureMonths) return "";
  const d = new Date(effectiveDate);
  d.setMonth(d.getMonth() + parseInt(tenureMonths));
  return d.toISOString().split("T")[0];
}

// Preview compound interest
function previewFD(amount, rate, months) {
  if (!amount || !rate || !months) return { maturity: 0, interest: 0 };
  const years = months / 12;
  const maturity = amount * Math.pow(1 + rate / 100, years);
  return {
    maturity: parseFloat(maturity.toFixed(2)),
    interest: parseFloat((maturity - amount).toFixed(2)),
  };
}

function FDForm({ data, onSubmit, isLoading, onCancel }) {
  const [investors, setInvestors] = useState([]);
  const [preview, setPreview] = useState({ maturity: 0, interest: 0 });

  useEffect(() => {
    investorService.getAll({ limit: 100 }).then((r) => setInvestors(r.data.data || []));
  }, []);

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      investorId: "", bankName: "", fdNumber: "", effectiveDate: "",
      amount: "", interestRate: "", tenureMonths: "", maturityDate: "",
      interestFrequency: "On Maturity", status: "Active", notes: "",
    },
  });

  const [amount, interestRate, tenureMonths, effectiveDate] = watch(["amount", "interestRate", "tenureMonths", "effectiveDate"]);

  // Auto-calc maturity date
  useEffect(() => {
    if (effectiveDate && tenureMonths) {
      setValue("maturityDate", calcMaturityDate(effectiveDate, tenureMonths));
    }
  }, [effectiveDate, tenureMonths, setValue]);

  // Live preview
  useEffect(() => {
    setPreview(previewFD(Number(amount), Number(interestRate), Number(tenureMonths)));
  }, [amount, interestRate, tenureMonths]);

  useEffect(() => {
    if (data) {
      reset({
        investorId: data.investorId?._id || data.investorId || "",
        bankName: data.bankName, fdNumber: data.fdNumber || "",
        effectiveDate: data.effectiveDate ? data.effectiveDate.split("T")[0] : "",
        amount: data.amount, interestRate: data.interestRate,
        tenureMonths: data.tenureMonths,
        maturityDate: data.maturityDate ? data.maturityDate.split("T")[0] : "",
        interestFrequency: data.interestFrequency, status: data.status,
        notes: data.notes || "",
      });
    } else {
      reset({
        investorId: "", bankName: "", fdNumber: "", effectiveDate: "",
        amount: "", interestRate: "", tenureMonths: "", maturityDate: "",
        interestFrequency: "On Maturity", status: "Active", notes: "",
      });
    }
  }, [data, reset]);

  const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Investor *</label>
          <select {...register("investorId")} className={ic}>
            <option value="">Select investor...</option>
            {investors.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
          {errors.investorId && <p className="text-red-400 text-xs mt-1">{errors.investorId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Bank Name *</label>
          <input {...register("bankName")} className={ic} placeholder="e.g. SBI Bank" />
          {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">FD Number</label>
          <input {...register("fdNumber")} className={ic} placeholder="e.g. FD-SBI-001" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Effective Date *</label>
          <input {...register("effectiveDate")} type="date" className={ic} />
          {errors.effectiveDate && <p className="text-red-400 text-xs mt-1">{errors.effectiveDate.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Tenure (Months) *</label>
          <input {...register("tenureMonths")} type="number" className={ic} placeholder="12" />
          {errors.tenureMonths && <p className="text-red-400 text-xs mt-1">{errors.tenureMonths.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">FD Amount (₹) *</label>
          <input {...register("amount")} type="number" className={ic} placeholder="500000" />
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Interest Rate (% p.a.) *</label>
          <input {...register("interestRate")} type="number" step="0.01" className={ic} placeholder="7.5" />
          {errors.interestRate && <p className="text-red-400 text-xs mt-1">{errors.interestRate.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Maturity Date</label>
          <input {...register("maturityDate")} type="date" className={ic} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Interest Frequency</label>
          <select {...register("interestFrequency")} className={ic}>
            {["Monthly", "Quarterly", "Half-Yearly", "Yearly", "On Maturity"].map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
          <select {...register("status")} className={ic}>
            <option value="Active">Active</option>
            <option value="Matured">Matured</option>
            <option value="Premature Closed">Premature Closed</option>
          </select>
        </div>
      </div>

      {/* Live Calculation Preview */}
      {preview.maturity > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">Maturity Amount</p>
            <p className="text-blue-400 font-bold text-lg">{formatCurrency(preview.maturity)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Interest Earned</p>
            <p className="text-emerald-400 font-bold text-lg">{formatCurrency(preview.interest)}</p>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Notes</label>
        <textarea {...register("notes")} rows={2} className={`${ic} resize-none`} placeholder="Optional notes..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {data ? "Update FD" : "Create FD"}
        </button>
      </div>
    </form>
  );
}

const columns = [
  { accessorKey: "investorId", header: "Investor", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()?.name || "—"}</span> },
  { accessorKey: "bankName", header: "Bank" },
  { accessorKey: "fdNumber", header: "FD Number", cell: ({ getValue }) => <span className="font-mono text-xs text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "amount", header: "Amount", cell: ({ getValue }) => <span className="font-medium">{formatCurrency(getValue())}</span> },
  { accessorKey: "interestRate", header: "Rate", cell: ({ getValue }) => <span className="text-amber-400 font-medium">{getValue()}%</span> },
  { accessorKey: "tenureMonths", header: "Tenure", cell: ({ getValue }) => <span>{getValue()} mo</span> },
  { accessorKey: "maturityAmount", header: "Maturity Amt", cell: ({ getValue }) => <span className="text-emerald-400 font-semibold">{formatCurrency(getValue())}</span> },
  { accessorKey: "interestEarned", header: "Interest", cell: ({ getValue }) => <span className="text-blue-400">{formatCurrency(getValue())}</span> },
  { accessorKey: "maturityDate", header: "Maturity Date", cell: ({ getValue }) => formatDate(getValue()) },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function FixedDepositsPage() {
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

  // Summary stats
  const totalFD = records.reduce((s, r) => s + (r.amount || 0), 0);
  const totalMaturity = records.reduce((s, r) => s + (r.maturityAmount || 0), 0);
  const totalInterest = records.reduce((s, r) => s + (r.interestEarned || 0), 0);

  const fetchData = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const res = await fdService.getAll({ page: p, limit: 10, search: s });
      setRecords(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load FDs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editRecord) { await fdService.update(editRecord._id, data); toast.success("FD updated!"); }
      else { await fdService.create(data); toast.success("FD created!"); }
      setModalOpen(false);
      fetchData(page, search);
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setFormLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await fdService.delete(deleteId);
      toast.success("FD deleted!");
      setDeleteOpen(false);
      fetchData(page, search);
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
        title="Fixed Deposits"
        description="Track and manage all fixed deposit investments"
        actions={
          <button onClick={() => { setEditRecord(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20">
            <Plus className="w-4 h-4" /> Add FD
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Invested", value: formatCurrency(totalFD), icon: Banknote, color: "stat-card-blue" },
          { label: "Total Maturity", value: formatCurrency(totalMaturity), icon: TrendingUp, color: "stat-card-emerald" },
          { label: "Total Interest", value: formatCurrency(totalInterest), icon: Calculator, color: "stat-card-amber" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-5 ${s.color}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">{s.label}</p>
              <s.icon className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5">
        <DataTable
          columns={[...columns, actionColumn]}
          data={records} loading={loading} totalRows={total}
          page={page} pageSize={10}
          onPageChange={(p) => { setPage(p); fetchData(p, search); }}
          onSearch={(s) => { setSearch(s); setPage(1); fetchData(1, s); }}
          searchPlaceholder="Search by bank name..."
        />
      </div>

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editRecord ? "Edit Fixed Deposit" : "Add Fixed Deposit"} size="xl">
        <FDForm data={editRecord} onSubmit={handleFormSubmit} isLoading={formLoading} onCancel={() => setModalOpen(false)} />
      </FormModal>

      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm} loading={deleteLoading} />
    </div>
  );
}

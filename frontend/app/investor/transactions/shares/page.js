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
import { companyService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  effectiveDate:     z.string().min(1, "Effective Date is required"),
  bseNseFlag:        z.enum(["BSE", "NSE"]),
  companyId:         z.string().min(1, "Scrip is required"),
  isin:              z.string().optional(),
  sector:            z.string().optional(),
  type:              z.enum(["Purchase", "Sales"]),
  jointHolder1:      z.string().optional(),
  jointHolder2:      z.string().optional(),
  amount:            z.coerce.number().min(0),
  firstDividendDate: z.string().optional(),
  price:             z.coerce.number().min(0),
  noOfShares:        z.coerce.number().min(0),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function ShareForm({ data, onSubmit, isLoading, onCancel }) {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    companyService.getAll({ limit: 200 }).then((r) => setCompanies(r.data.data || []));
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      effectiveDate: new Date().toISOString().split("T")[0],
      bseNseFlag: "NSE", companyId: "", isin: "", sector: "",
      type: "Purchase", jointHolder1: "", jointHolder2: "",
      amount: "", firstDividendDate: "", price: "", noOfShares: "",
    },
  });

  const watchedCompanyId = watch("companyId");

  useEffect(() => {
    if (watchedCompanyId) {
      const company = companies.find((c) => c._id === watchedCompanyId);
      if (company) {
        setValue("isin", company.isin || "");
        setValue("sector", company.sector || "");
      }
    }
  }, [watchedCompanyId, companies, setValue]);

  useEffect(() => {
    if (data) {
      reset({
        effectiveDate: data.effectiveDate?.split("T")[0] || "",
        bseNseFlag: data.bseNseFlag || "NSE",
        companyId: data.companyId?._id || data.companyId || "",
        isin: data.isin || "",
        sector: data.sector || "",
        type: data.type || "Purchase",
        jointHolder1: data.jointHolder1 || "",
        jointHolder2: data.jointHolder2 || "",
        amount: data.amount || "",
        firstDividendDate: data.firstDividendDate?.split("T")[0] || "",
        price: data.price || "",
        noOfShares: data.noOfShares || "",
      });
    } else {
      reset({
        effectiveDate: new Date().toISOString().split("T")[0],
        bseNseFlag: "NSE", companyId: "", isin: "", sector: "",
        type: "Purchase", jointHolder1: "", jointHolder2: "",
        amount: "", firstDividendDate: "", price: "", noOfShares: "",
      });
    }
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Effective Date *</label>
          <input {...register("effectiveDate")} type="date" className={ic} />
          {errors.effectiveDate && <p className="text-red-400 text-xs mt-1">{errors.effectiveDate.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Transaction Type *</label>
          <select {...register("type")} className={ic}>
            <option value="Purchase">Purchase</option>
            <option value="Sales">Sales</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">BSE / NSE Flag *</label>
          <select {...register("bseNseFlag")} className={ic}>
            <option value="BSE">BSE</option>
            <option value="NSE">NSE</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Scrip Code *</label>
          <select {...register("companyId")} className={ic}>
            <option value="">Select Scrip Name...</option>
            {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {errors.companyId && <p className="text-red-400 text-xs mt-1">{errors.companyId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">ISIN</label>
          <input {...register("isin")} className={ic} placeholder="Actual ISIN" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Sector</label>
          <input {...register("sector")} className={ic} placeholder="Actual Sector Name" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Joint Holder 1</label>
          <input {...register("jointHolder1")} className={ic} placeholder="Actual Joint Holder 1 Name" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Joint Holder 2</label>
          <input {...register("jointHolder2")} className={ic} placeholder="Actual Joint Holder 2 Name" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Amount Invested</label>
          <input {...register("amount")} type="number" step="0.01" className={ic} placeholder="₹ 0.00" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">First Dividend Date</label>
          <input {...register("firstDividendDate")} type="date" className={ic} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Price</label>
          <input {...register("price")} type="number" step="0.01" className={ic} placeholder="₹ 0.00" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">No. of Shares</label>
          <input {...register("noOfShares")} type="number" step="1" className={ic} placeholder="e.g. 100" />
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

const txColumns = [
  { accessorKey: "effectiveDate", header: "Effective Date", cell: ({ getValue }) => <span className="font-semibold text-slate-200">{formatDate(getValue())}</span> },
  { accessorKey: "bseNseFlag", header: "BSE/NSE", cell: ({ getValue }) => <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${getValue() === "BSE" ? "text-orange-400 bg-orange-500/10" : "text-blue-400 bg-blue-500/10"}`}>{getValue()}</span> },
  { accessorKey: "companyId", header: "Scrip Code", cell: ({ getValue }) => <span className="font-semibold text-blue-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "isin", header: "ISIN", cell: ({ getValue }) => <span className="font-mono text-slate-400 text-xs">{getValue() || "—"}</span> },
  { accessorKey: "sector", header: "Sector", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "type", header: "Type", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
  { accessorKey: "amount", header: "Amount Invested", cell: ({ getValue }) => <span className="font-bold text-slate-100">{formatCurrency(getValue())}</span> },
  { accessorKey: "price", header: "Price", cell: ({ getValue }) => getValue() ? `₹${Number(getValue()).toFixed(2)}` : "—" },
  { accessorKey: "noOfShares", header: "No. of Shares", cell: ({ getValue }) => getValue() ? Number(getValue()).toLocaleString("en-IN") : "—" },
];

export default function InvestorSharesPage() {
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

  const totalPurchased = records.filter((r) => r.type === "Purchase").reduce((s, r) => s + (r.amount || 0), 0);
  const totalSales = records.filter((r) => r.type === "Sales").reduce((s, r) => s + (r.amount || 0), 0);

  const fetchTx = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const res = await investorPortalService.getShares({ page: p, limit: 10, search: s });
      setRecords(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load share transactions"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editRecord) { await investorPortalService.updateShare(editRecord._id, data); toast.success("Updated!"); }
      else { await investorPortalService.createShare(data); toast.success("Transaction recorded!"); }
      setModalOpen(false);
      fetchTx(page, search);
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await investorPortalService.deleteShare(deleteId);
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
      <PageHeader title="Shares — Purchase / Sales" description="Manage your share purchase and sales transactions"
        actions={<button onClick={() => { setEditRecord(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4" /> Add Transaction</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5">
          <p className="text-slate-400 text-sm mb-2">Total Purchased</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalPurchased)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-rose-500/20 bg-rose-500/5">
          <p className="text-slate-400 text-sm mb-2">Total Sales</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalSales)}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <DataTable columns={[...txColumns, actionColumn]} data={records} loading={loading} totalRows={total}
          page={page} pageSize={10}
          onPageChange={(p) => { setPage(p); fetchTx(p, search); }}
          onSearch={(s) => { setSearch(s); setPage(1); fetchTx(1, s); }}
          searchPlaceholder="Search share transactions..." />
      </div>

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? "Edit Share Transaction" : "Add Share Transaction"} size="xl">
        <ShareForm data={editRecord} onSubmit={handleFormSubmit} isLoading={formLoading} onCancel={() => setModalOpen(false)} />
      </FormModal>
      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}

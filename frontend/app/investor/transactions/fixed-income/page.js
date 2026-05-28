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
import { investorPortalService } from "@/services/investor-api.service";
import { companyService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";

/* ── Fixed Income — exact screenshot fields ── */
const FI_SUBCATEGORIES = [
  "BNFD", "CNFD", "BCFD", "CCFD", "CD", "NCD", "PMIS", "PTD", "Insurance Annuity",
];

// Per screenshot: BNFD/BCFD→Banks, CNFD/CCFD/CD/NCD→Companies, PMIS/PTD→Post Office
const BANK_SUBCATS    = new Set(["BNFD", "BCFD"]);
const COMPANY_SUBCATS = new Set(["CNFD", "CCFD", "CD", "NCD"]);
const POST_SUBCATS    = new Set(["PMIS", "PTD"]);

function filterCompaniesBySubcat(all, subcat) {
  if (BANK_SUBCATS.has(subcat))    return all.filter(c => c.flag === 'B');
  if (COMPANY_SUBCATS.has(subcat)) return all.filter(c => c.flag === 'C');
  if (POST_SUBCATS.has(subcat))    return all.filter(c => c.name?.toLowerCase().includes('post'));
  return all;
}

const schema = z.object({
  effectiveDate:     z.string().min(1, "Effective Date is required"),
  subcategoryCode:   z.string().min(1, "Sub-Category is required"),
  companyId:         z.string().min(1, "Company / Bank is required"),
  jointHolder1:      z.string().optional(),
  jointHolder2:      z.string().optional(),
  depositAmount:     z.coerce.number().positive("Deposit Amount must be positive"),
  interestRate:      z.coerce.number().positive().max(100),
  firstInterestDate: z.string().optional(),
  maturityDate:      z.string().min(1, "Maturity Date is required"),
  maturityAmount:    z.coerce.number().min(0).optional(),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function FDForm({ data, onSubmit, isLoading, onCancel }) {
  const [allCompanies, setAllCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    companyService.getAll({ limit: 2000 }).then((r) => setAllCompanies(r.data.data || []));
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      effectiveDate: new Date().toISOString().split("T")[0],
      subcategoryCode: "BNFD", companyId: "",
      jointHolder1: "", jointHolder2: "",
      depositAmount: "", interestRate: "",
      firstInterestDate: "", maturityDate: "", maturityAmount: "",
    },
  });

  const watchedCompanyId = watch("companyId");
  const watchedSubcat    = watch("subcategoryCode");

  // Filter companies based on subcategory selection
  useEffect(() => {
    setFilteredCompanies(filterCompaniesBySubcat(allCompanies, watchedSubcat));
    setValue("companyId", "");
    setSelectedCompany(null);
  }, [watchedSubcat, allCompanies, setValue]);

  useEffect(() => {
    const co = allCompanies.find((c) => c._id === watchedCompanyId);
    setSelectedCompany(co || null);
  }, [watchedCompanyId, allCompanies]);

  useEffect(() => {
    if (data) {
      reset({
        effectiveDate: data.effectiveDate?.split("T")[0] || "",
        subcategoryCode: data.subcategoryCode || "BNFD",
        companyId: data.companyId?._id || data.companyId || "",
        jointHolder1: data.jointHolder1 || "",
        jointHolder2: data.jointHolder2 || "",
        depositAmount: data.depositAmount || "",
        interestRate: data.interestRate || "",
        firstInterestDate: data.firstInterestDate?.split("T")[0] || "",
        maturityDate: data.maturityDate?.split("T")[0] || "",
        maturityAmount: data.maturityAmount || "",
      });
      const co = allCompanies.find((c) => c._id === (data.companyId?._id || data.companyId));
      setSelectedCompany(co || null);
    } else {
      reset({
        effectiveDate: new Date().toISOString().split("T")[0],
        subcategoryCode: "BNFD", companyId: "",
        jointHolder1: "", jointHolder2: "",
        depositAmount: "", interestRate: "",
        firstInterestDate: "", maturityDate: "", maturityAmount: "",
      });
      setSelectedCompany(null);
    }
  }, [data, reset, allCompanies]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Effective Date */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Effective Date *</label>
          <input {...register("effectiveDate")} type="date" className={ic} />
          {errors.effectiveDate && <p className="text-red-400 text-xs mt-1">{errors.effectiveDate.message}</p>}
        </div>

        {/* Asset Sub Class Code */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Asset Sub Class Code *</label>
          <select {...register("subcategoryCode")} className={ic}>
            {FI_SUBCATEGORIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Company / Bank Code — filtered by asset sub class */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">
            Company / Bank Code * <span className="text-slate-500 text-xs">(filtered by sub class)</span>
          </label>
          <select {...register("companyId")} className={ic}>
            <option value="">
              {filteredCompanies.length === 0 ? "No matches for this sub class" : "Select Company / Bank Name..."}
            </option>
            {filteredCompanies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code ? `${c.code} — ` : ""}{c.name} ({c.flag === "B" ? "Bank" : "Company"})
              </option>
            ))}
          </select>
          {errors.companyId && <p className="text-red-400 text-xs mt-1">{errors.companyId.message}</p>}
        </div>

        {/* Company Name auto-display */}
        {selectedCompany && (
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Company / Bank Name</label>
            <input value={selectedCompany.name} readOnly className={`${ic} opacity-60 cursor-not-allowed`} />
          </div>
        )}

        {/* Joint Holder 1 */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Joint Holder 1</label>
          <input {...register("jointHolder1")} className={ic} placeholder="Joint Holder 1 Name" />
        </div>

        {/* Joint Holder 2 */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Joint Holder 2</label>
          <input {...register("jointHolder2")} className={ic} placeholder="Joint Holder 2 Name" />
        </div>

        {/* Deposit Amount */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Deposit Amount *</label>
          <input {...register("depositAmount")} type="number" step="0.01" className={ic} placeholder="₹ 0.00" />
          {errors.depositAmount && <p className="text-red-400 text-xs mt-1">{errors.depositAmount.message}</p>}
        </div>

        {/* Interest Rate */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Interest Rate (% p.a.) *</label>
          <input {...register("interestRate")} type="number" step="0.01" className={ic} placeholder="e.g. 7.5" />
          {errors.interestRate && <p className="text-red-400 text-xs mt-1">{errors.interestRate.message}</p>}
        </div>

        {/* First Interest Date */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">First Interest Date</label>
          <input {...register("firstInterestDate")} type="date" className={ic} />
        </div>

        {/* Maturity Date */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Maturity Date *</label>
          <input {...register("maturityDate")} type="date" className={ic} />
          {errors.maturityDate && <p className="text-red-400 text-xs mt-1">{errors.maturityDate.message}</p>}
        </div>

        {/* Maturity Amount */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Maturity Amount</label>
          <input {...register("maturityAmount")} type="number" step="0.01" className={ic} placeholder="₹ 0.00" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {data ? "Update" : "Record"}
        </button>
      </div>
    </form>
  );
}

const txColumns = [
  { accessorKey: "effectiveDate", header: "Effective Date", cell: ({ getValue }) => <span className="font-semibold text-slate-200">{formatDate(getValue())}</span> },
  { accessorKey: "subcategoryCode", header: "Sub-Category", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-lg text-xs">{getValue()}</span> },
  { accessorKey: "companyId", header: "Company / Bank", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()?.name || "—"}</span> },
  { accessorKey: "depositAmount", header: "Deposit Amount", cell: ({ getValue }) => <span className="font-bold text-slate-100">{formatCurrency(getValue())}</span> },
  { accessorKey: "interestRate", header: "Rate %", cell: ({ getValue }) => <span className="text-amber-400 font-semibold">{getValue()}%</span> },
  { accessorKey: "maturityDate", header: "Maturity Date", cell: ({ getValue }) => <span className="text-slate-300">{formatDate(getValue())}</span> },
  { accessorKey: "maturityAmount", header: "Maturity Amount", cell: ({ getValue }) => getValue() ? <span className="text-emerald-400 font-bold">{formatCurrency(getValue())}</span> : <span className="text-slate-500">—</span> },
];

export default function InvestorFixedIncomePage() {
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

  const totalDeposits = records.reduce((s, r) => s + (r.depositAmount || 0), 0);
  const totalMaturity = records.reduce((s, r) => s + (r.maturityAmount || 0), 0);

  const fetchTx = useCallback(async (p = 1, s = "") => {
    setLoading(true);
    try {
      const res = await investorPortalService.getFD({ page: p, limit: 10, search: s });
      setRecords(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch { toast.error("Failed to load Fixed Income records"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const handleFormSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editRecord) { await investorPortalService.updateFD(editRecord._id, data); toast.success("Updated!"); }
      else { await investorPortalService.createFD(data); toast.success("Record created!"); }
      setModalOpen(false);
      fetchTx(page, search);
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await investorPortalService.deleteFD(deleteId);
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
      <PageHeader title="Fixed Income — Fresh Fixed Deposit" description="Manage your fixed income investments"
        actions={<button onClick={() => { setEditRecord(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4" /> Add Record</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-blue-500/20 bg-blue-500/5">
          <p className="text-slate-400 text-sm mb-2">Total Deposit Amount</p>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(totalDeposits)}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-slate-400 text-sm mb-2">Total Maturity Amount</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalMaturity)}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <DataTable columns={[...txColumns, actionColumn]} data={records} loading={loading} totalRows={total}
          page={page} pageSize={10}
          onPageChange={(p) => { setPage(p); fetchTx(p, search); }}
          onSearch={(s) => { setSearch(s); setPage(1); fetchTx(1, s); }}
          searchPlaceholder="Search fixed income records..." />
      </div>

      <FormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editRecord ? "Edit Fixed Income Record" : "Add Fixed Income Record"} size="xl">
        <FDForm data={editRecord} onSubmit={handleFormSubmit} isLoading={formLoading} onCancel={() => setModalOpen(false)} />
      </FormModal>
      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} loading={deleteLoading} />
    </div>
  );
}

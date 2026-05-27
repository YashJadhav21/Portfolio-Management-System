"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { companyService, bankService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";
import StatusBadge from "@/components/ui/StatusBadge";

/* ── Shared input class ─────────────────────────────────── */
const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

/* ── Company Form & Columns ─────────────────────────────── */
const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  symbol: z.string().min(1, "Stock symbol is required"),
  exchange: z.enum(["BSE", "NSE", "Both"]),
  sector: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

function CompanyForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "", symbol: "", exchange: "Both", sector: "", industry: "", status: "Active" },
  });

  useEffect(() => {
    if (data) reset({ name: data.name, symbol: data.symbol, exchange: data.exchange || "Both", sector: data.sector || "", industry: data.industry || "", status: data.status });
    else reset({ name: "", symbol: "", exchange: "Both", sector: "", industry: "", status: "Active" });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Company Name *</label>
          <input {...register("name")} className={ic} placeholder="e.g. Reliance Industries" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Stock Symbol *</label>
          <input {...register("symbol")} className={ic} placeholder="e.g. RELIANCE" style={{ textTransform: "uppercase" }} />
          {errors.symbol && <p className="text-red-400 text-xs mt-1">{errors.symbol.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Exchange *</label>
          <select {...register("exchange")} className={ic}>
            <option value="BSE">BSE</option>
            <option value="NSE">NSE</option>
            <option value="Both">Both (BSE &amp; NSE)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Sector</label>
          <input {...register("sector")} className={ic} placeholder="e.g. Energy" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Industry</label>
          <input {...register("industry")} className={ic} placeholder="e.g. Oil &amp; Gas" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
          <select {...register("status")} className={ic}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {data ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

const companyColumns = [
  { accessorKey: "name", header: "Company Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
  { accessorKey: "symbol", header: "Symbol", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-bold">{getValue()}</span> },
  {
    accessorKey: "exchange", header: "Exchange",
    cell: ({ getValue }) => {
      const ex = getValue() || "—";
      const color = ex === "BSE" ? "text-orange-400 bg-orange-500/10" : ex === "NSE" ? "text-blue-400 bg-blue-500/10" : "text-purple-400 bg-purple-500/10";
      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${color}`}>{ex}</span>;
    }
  },
  { accessorKey: "sector", header: "Sector", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

/* ── Bank Form & Columns ─────────────────────────────────── */
const bankSchema = z.object({
  name: z.string().min(1, "Bank name is required"),
  code: z.string().optional(),
  branch: z.string().optional(),
  ifsc: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

function BankForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: { name: "", code: "", branch: "", ifsc: "", status: "Active" },
  });

  useEffect(() => {
    if (data) reset({ name: data.name, code: data.code || "", branch: data.branch || "", ifsc: data.ifsc || "", status: data.status });
    else reset({ name: "", code: "", branch: "", ifsc: "", status: "Active" });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Bank Name *</label>
          <input {...register("name")} className={ic} placeholder="e.g. State Bank of India" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Bank Code</label>
          <input {...register("code")} className={ic} placeholder="e.g. SBI" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Branch</label>
          <input {...register("branch")} className={ic} placeholder="e.g. Main Branch" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">IFSC Code</label>
          <input {...register("ifsc")} className={ic} placeholder="e.g. SBIN0001234" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
          <select {...register("status")} className={ic}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
          {data ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

const bankColumns = [
  { accessorKey: "name", header: "Bank Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
  { accessorKey: "code", header: "Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400 font-semibold">{getValue() || "—"}</span> },
  { accessorKey: "branch", header: "Branch", cell: ({ getValue }) => <span className="text-slate-300">{getValue() || "—"}</span> },
  { accessorKey: "ifsc", header: "IFSC", cell: ({ getValue }) => <span className="font-mono text-blue-400 text-xs">{getValue() || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

/* ── Tabbed Page ─────────────────────────────────────────── */
export default function InvestorCompaniesPage() {
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 mb-5">
        {[
          { id: "companies", label: "Companies (Stocks)" },
          { id: "banks", label: "Banks" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-all ${
              activeTab === tab.id
                ? "bg-emerald-600/20 text-emerald-400 border-b-2 border-emerald-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "companies" ? (
        <CrudPage
          title="Company / Bank Master — Companies"
          description="Listed companies available for share transactions"
          service={companyService}
          columns={companyColumns}
          FormComponent={CompanyForm}
          searchPlaceholder="Search companies..."
        />
      ) : (
        <CrudPage
          title="Company / Bank Master — Banks"
          description="Banks available for fixed income transactions"
          service={bankService}
          columns={bankColumns}
          FormComponent={BankForm}
          searchPlaceholder="Search banks..."
        />
      )}
    </div>
  );
}

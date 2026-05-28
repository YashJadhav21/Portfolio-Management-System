"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { companyService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";

const schema = z.object({
  code:   z.string().optional(),
  name:   z.string().min(1, "Company / Bank Name is required"),
  flag:   z.enum(["C", "B"]),
  isin:   z.string().optional(),
  sector: z.string().optional(),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function CompanyForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", flag: "C", isin: "", sector: "" },
  });

  const watchedFlag = watch("flag");

  useEffect(() => {
    if (data) reset({ code: data.code || "", name: data.name, flag: data.flag || "C", isin: data.isin || "", sector: data.sector || "" });
    else reset({ code: "", name: "", flag: "C", isin: "", sector: "" });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Company / Bank Code</label>
          <input {...register("code")} className={ic} placeholder="e.g. CB-001" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Company / Bank Name *</label>
          <input {...register("name")} className={ic} placeholder="e.g. Reliance Industries / SBI" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Company / Bank Flag *</label>
          <select {...register("flag")} className={ic}>
            <option value="C">C — Company</option>
            <option value="B">B — Bank</option>
          </select>
        </div>
        {watchedFlag === "C" && (
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">ISIN <span className="text-slate-500 text-xs">(If Flag = C)</span></label>
            <input {...register("isin")} className={ic} placeholder="e.g. INE002A01018" />
          </div>
        )}
        <div className={watchedFlag !== "C" ? "sm:col-span-2" : ""}>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Sector</label>
          <input {...register("sector")} className={ic} placeholder="Actual Sector Name" />
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

const columns = [
  { accessorKey: "code", header: "Code", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold">{getValue() || "—"}</span> },
  { accessorKey: "name", header: "Company / Bank Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
  { accessorKey: "flag", header: "Flag", cell: ({ getValue }) => { const f = getValue(); return <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${f === "C" ? "text-blue-400 bg-blue-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>{f === "C" ? "C — Company" : "B — Bank"}</span>; } },
  { accessorKey: "isin", header: "ISIN", cell: ({ getValue }) => <span className="font-mono text-slate-300 text-xs">{getValue() || "—"}</span> },
  { accessorKey: "sector", header: "Sector", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
];

export default function InvestorCompaniesPage() {
  return (
    <CrudPage
      title="Company / Bank Master"
      description="Companies (C) and Banks (B) — ISIN shown for Companies only"
      service={companyService}
      columns={columns}
      FormComponent={CompanyForm}
      searchPlaceholder="Search companies / banks..."
    />
  );
}

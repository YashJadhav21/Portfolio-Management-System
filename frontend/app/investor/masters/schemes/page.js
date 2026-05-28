"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schemeService, amcService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";

const schema = z.object({
  amcId:      z.string().min(1, "AMC is required"),
  schemeCode: z.string().optional(),
  name:       z.string().min(1, "Scheme Name is required"),
  isin:       z.string().optional(),
  mfType:     z.string().optional(),
  dgFlag:     z.enum(["Dividend", "Growth", ""]).optional(),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function SchemeForm({ data, onSubmit, isLoading, onCancel }) {
  const [amcs, setAmcs] = useState([]);
  const [selectedAmc, setSelectedAmc] = useState(null);

  useEffect(() => {
    amcService.getAll({ limit: 500 }).then((r) => setAmcs(r.data.data || []));
  }, []);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { amcId: "", schemeCode: "", name: "", isin: "", mfType: "", dgFlag: "" },
  });

  const watchedAmcId = watch("amcId");

  useEffect(() => {
    const amc = amcs.find((a) => a._id === watchedAmcId);
    setSelectedAmc(amc || null);
  }, [watchedAmcId, amcs]);

  useEffect(() => {
    if (data) {
      reset({ amcId: data.amcId?._id || data.amcId || "", schemeCode: data.schemeCode || "", name: data.name, isin: data.isin || "", mfType: data.mfType || "", dgFlag: data.dgFlag || "" });
      const amc = amcs.find((a) => a._id === (data.amcId?._id || data.amcId));
      setSelectedAmc(amc || null);
    } else {
      reset({ amcId: "", schemeCode: "", name: "", isin: "", mfType: "", dgFlag: "" });
      setSelectedAmc(null);
    }
  }, [data, reset, amcs]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">AMC Code *</label>
          <select {...register("amcId")} className={ic}>
            <option value="">Select AMC...</option>
            {amcs.map((a) => <option key={a._id} value={a._id}>{a.code ? `${a.code} — ${a.name}` : a.name}</option>)}
          </select>
          {errors.amcId && <p className="text-red-400 text-xs mt-1">{errors.amcId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">AMC Name</label>
          <input value={selectedAmc?.name || ""} readOnly className={`${ic} opacity-60 cursor-not-allowed`} placeholder="Auto-filled from AMC" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Scheme Code</label>
          <input {...register("schemeCode")} className={ic} placeholder="Actual Scheme Code" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Scheme Name *</label>
          <input {...register("name")} className={ic} placeholder="Actual Scheme Name" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">ISIN</label>
          <input {...register("isin")} className={ic} placeholder="Actual Value" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Type of MF</label>
          <select {...register("mfType")} className={ic}>
            <option value="">Select Type of MF...</option>
            <option value="Large Cap">Large Cap</option>
            <option value="Mid Cap">Mid Cap</option>
            <option value="Flexi Cap">Flexi Cap</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">D / G Flag</label>
          <select {...register("dgFlag")} className={ic}>
            <option value="">Select...</option>
            <option value="Dividend">Dividend</option>
            <option value="Growth">Growth</option>
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

const columns = [
  { accessorKey: "amcId", header: "AMC Code", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold">{getValue()?.code || getValue()?.name || "—"}</span> },
  { accessorKey: "amcId", header: "AMC Name", id: "amcName", cell: ({ getValue }) => <span className="text-slate-300">{getValue()?.name || "—"}</span> },
  { accessorKey: "schemeCode", header: "Scheme Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400 font-semibold">{getValue() || "—"}</span> },
  { accessorKey: "name", header: "Scheme Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100 max-w-[200px] truncate block">{getValue()}</span> },
  { accessorKey: "isin", header: "ISIN", cell: ({ getValue }) => <span className="font-mono text-slate-400 text-xs">{getValue() || "—"}</span> },
  { accessorKey: "mfType", header: "Type of MF", cell: ({ getValue }) => <span className="text-slate-300">{getValue() || "—"}</span> },
  { accessorKey: "dgFlag", header: "D/G Flag", cell: ({ getValue }) => getValue() ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${getValue() === "Dividend" ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>{getValue()}</span> : <span className="text-slate-500">—</span> },
];

export default function InvestorSchemesPage() {
  return (
    <CrudPage
      title="Scheme Master"
      description="Mutual fund schemes — AMC Code, Scheme Code, ISIN, Type of MF, D/G Flag"
      service={schemeService}
      columns={columns}
      FormComponent={SchemeForm}
      searchPlaceholder="Search schemes..."
    />
  );
}

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { categoryService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";

const CATEGORY_NAMES = [
  "Fixed Income Securities",
  "Mutual Funds",
  "Shares",
  "Insurance",
];

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Category name is required"),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function CategoryForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "Fixed Income Securities" },
  });

  useEffect(() => {
    if (data) reset({ code: data.code || "", name: data.name });
    else reset({ code: "", name: "Fixed Income Securities" });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Category Code</label>
          <input {...register("code")} className={ic} placeholder="e.g. FI, MF, SH, INS" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Category Name *</label>
          <select {...register("name")} className={ic}>
            {CATEGORY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
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
  { accessorKey: "code", header: "Category Code", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold">{getValue() || "—"}</span> },
  { accessorKey: "name", header: "Category Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
];

export default function InvestorCategoriesPage() {
  return (
    <CrudPage
      title="Categories"
      description="Asset categories: Fixed Income Securities, Mutual Funds, Shares, Insurance"
      service={categoryService}
      columns={columns}
      FormComponent={CategoryForm}
      searchPlaceholder="Search categories..."
    />
  );
}

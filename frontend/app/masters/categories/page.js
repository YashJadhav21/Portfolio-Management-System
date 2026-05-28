"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { categoryService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function CategoryForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", description: "" },
  });

  useEffect(() => {
    if (data) reset({ code: data.code || "", name: data.name, description: data.description || "" });
    else reset({ code: "", name: "", description: "" });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Category Code</label>
          <input {...register("code")} className={ic} placeholder="e.g. FI, MF, EQ" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Category Name *</label>
          <input {...register("name")} className={ic} placeholder="e.g. Fixed Income Securities" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Description</label>
        <textarea {...register("description")} rows={2} className={`${ic} resize-none`} placeholder="Optional description..." />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
        <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
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
  { accessorKey: "description", header: "Description", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "createdAt", header: "Created", cell: ({ getValue }) => <span className="text-slate-400 text-sm">{new Date(getValue()).toLocaleDateString("en-IN")}</span> },
];

export default function CategoriesPage() {
  return (
    <CrudPage
      title="Categories"
      description="Manage asset categories: Fixed Income Securities, Mutual Funds, Shares, Insurance"
      service={categoryService}
      columns={columns}
      FormComponent={CategoryForm}
      searchPlaceholder="Search categories..."
    />
  );
}

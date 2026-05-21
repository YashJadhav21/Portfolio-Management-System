"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { subcategoryService, categoryService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";

const schema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Subcategory name is required"),
  description: z.string().optional(),
});

function SubcategoryForm({ data, onSubmit, isLoading, onCancel }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryService.getAll({ limit: 100 }).then((r) => setCategories(r.data.data || []));
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: "", name: "", description: "" },
  });

  useEffect(() => {
    if (data) reset({ categoryId: data.categoryId?._id || data.categoryId || "", name: data.name, description: data.description || "" });
    else reset({ categoryId: "", name: "", description: "" });
  }, [data, reset]);

  const inputClass = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Category *</label>
        <select {...register("categoryId")} className={inputClass}>
          <option value="">Select category...</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Subcategory Name *</label>
        <input {...register("name")} className={inputClass} placeholder="e.g. Large Cap" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Description</label>
        <textarea {...register("description")} rows={3} className={`${inputClass} resize-none`} placeholder="Optional description..." />
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
  { accessorKey: "categoryId", header: "Category", cell: ({ getValue }) => <span className="text-blue-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "name", header: "Subcategory", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "description", header: "Description", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "createdAt", header: "Created", cell: ({ getValue }) => new Date(getValue()).toLocaleDateString("en-IN") },
];

export default function SubcategoriesPage() {
  return (
    <CrudPage
      title="Subcategories"
      description="Manage subcategories under each asset category"
      service={subcategoryService}
      columns={columns}
      FormComponent={SubcategoryForm}
      searchPlaceholder="Search subcategories..."
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { subcategoryService, categoryService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";

/* ── Chained subcategories from screenshot ── */
const SUBCATEGORY_MAP = {
  "Fixed Income Securities": [
    "BNFD", "CNFD", "BCFD", "CCFD", "CD", "NCD", "PMIS", "PTD", "Insurance Annuity",
  ],
  "Mutual Funds": ["Dividend", "Growth"],
  "Shares": ["Co-operative Bank", "Preference", "Equity"],
  "Insurance": ["Endowment", "ULIP", "Term Insurance", "Retirement / Pension"],
};

const schema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  code: z.string().optional(),
  name: z.string().min(1, "Subcategory name is required"),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function SubcategoryForm({ data, onSubmit, isLoading, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [availableSubcats, setAvailableSubcats] = useState([]);

  useEffect(() => {
    categoryService.getAll({ limit: 100 }).then((r) => setCategories(r.data.data || []));
  }, []);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { categoryId: "", code: "", name: "" },
  });

  const watchedCategoryId = watch("categoryId");

  // Chained: when category changes, update subcategory options
  useEffect(() => {
    const cat = categories.find((c) => c._id === watchedCategoryId);
    if (cat) {
      const subs = SUBCATEGORY_MAP[cat.name] || [];
      setAvailableSubcats(subs);
      // reset name to first valid option if not editing
      if (subs.length > 0) setValue("name", subs[0]);
    } else {
      setAvailableSubcats([]);
    }
  }, [watchedCategoryId, categories, setValue]);

  useEffect(() => {
    if (data) {
      const catId = data.categoryId?._id || data.categoryId || "";
      reset({ categoryId: catId, code: data.code || "", name: data.name });
      // Pre-load subcats for the category
      const cat = categories.find((c) => c._id === catId);
      if (cat) setAvailableSubcats(SUBCATEGORY_MAP[cat.name] || []);
    } else {
      reset({ categoryId: "", code: "", name: "" });
      setAvailableSubcats([]);
    }
  }, [data, reset, categories]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Category — drives chained dropdown */}
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Category Name *</label>
        <select {...register("categoryId")} className={ic}>
          <option value="">Select Category...</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sub-Category Code */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Sub-Category Code</label>
          <input {...register("code")} className={ic} placeholder="Actual Sub Category Code" />
        </div>

        {/* Sub-Category Name — chained dropdown */}
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Sub-Category Name *</label>
          {availableSubcats.length > 0 ? (
            <select {...register("name")} className={ic}>
              {availableSubcats.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input {...register("name")} className={ic} placeholder="Select a Category first..." disabled />
          )}
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
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
  { accessorKey: "categoryId", header: "Category", cell: ({ getValue }) => <span className="font-semibold text-blue-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "code", header: "Sub-Cat. Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400 font-semibold">{getValue() || "—"}</span> },
  { accessorKey: "name", header: "Sub-Category Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
];

export default function SubcategoriesPage() {
  return (
    <CrudPage
      title="Sub-Category Master"
      description="Manage subcategories — chained to Fixed Income, Mutual Funds, Shares, Insurance"
      service={subcategoryService}
      columns={columns}
      FormComponent={SubcategoryForm}
      searchPlaceholder="Search subcategories..."
    />
  );
}

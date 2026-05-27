"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { schemeService, amcService, categoryService, subcategoryService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Scheme name is required"),
  amcId: z.string().min(1, "AMC is required"),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional(),
  riskLevel: z.enum(["Low", "Moderate", "High", "Very High"]),
  nav: z.coerce.number().min(0, "NAV must be positive"),
  status: z.enum(["Active", "Inactive"]),
});

function SchemeForm({ data, onSubmit, isLoading, onCancel }) {
  const [amcs, setAmcs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    amcService.getAll({ limit: 100 }).then((r) => setAmcs(r.data.data || []));
    categoryService.getAll({ limit: 100 }).then((r) => setCategories(r.data.data || []));
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      subcategoryService.getAll({ limit: 100 }).then((r) => {
        const filtered = (r.data.data || []).filter((s) => (s.categoryId?._id || s.categoryId) === selectedCategory);
        setSubcategories(filtered);
      });
    }
  }, [selectedCategory]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", amcId: "", categoryId: "", subcategoryId: "", riskLevel: "Moderate", nav: 0, status: "Active" },
  });

  const watchedCategory = watch("categoryId");
  useEffect(() => { setSelectedCategory(watchedCategory); }, [watchedCategory]);

  useEffect(() => {
    if (data) {
      reset({
        name: data.name, amcId: data.amcId?._id || data.amcId || "",
        categoryId: data.categoryId?._id || data.categoryId || "",
        subcategoryId: data.subcategoryId?._id || data.subcategoryId || "",
        riskLevel: data.riskLevel, nav: data.nav, status: data.status,
      });
      setSelectedCategory(data.categoryId?._id || data.categoryId || "");
    } else {
      reset({ name: "", amcId: "", categoryId: "", subcategoryId: "", riskLevel: "Moderate", nav: 0, status: "Active" });
    }
  }, [data, reset]);

  const inputClass = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Scheme Name *</label>
        <input {...register("name")} className={inputClass} placeholder="e.g. SBI Bluechip Fund - Direct Growth" />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">AMC *</label>
          <select {...register("amcId")} className={inputClass}>
            <option value="">Select AMC...</option>
            {amcs.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
          {errors.amcId && <p className="text-red-400 text-xs mt-1">{errors.amcId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Category *</label>
          <select {...register("categoryId")} className={inputClass}>
            <option value="">Select Category...</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Subcategory</label>
          <select {...register("subcategoryId")} className={inputClass}>
            <option value="">Select Subcategory...</option>
            {subcategories.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Risk Level</label>
          <select {...register("riskLevel")} className={inputClass}>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Current NAV (₹)</label>
          <input {...register("nav")} type="number" step="0.01" className={inputClass} placeholder="0.00" />
          {errors.nav && <p className="text-red-400 text-xs mt-1">{errors.nav.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
          <select {...register("status")} className={inputClass}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
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
  { accessorKey: "amcId", header: "AMC", cell: ({ getValue }) => <span className="font-semibold text-slate-200">{getValue()?.name || "—"}</span> },
  { accessorKey: "code", header: "Scheme Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400 font-bold">{getValue() || "—"}</span> },
  { accessorKey: "name", header: "Scheme Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100 max-w-[280px] truncate block">{getValue()}</span> },
  { accessorKey: "categoryId", header: "Category", cell: ({ getValue }) => <span className="font-semibold text-blue-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "riskLevel", header: "Risk", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
  { accessorKey: "nav", header: "NAV (₹)", cell: ({ getValue }) => <span className="font-bold text-emerald-400">₹{getValue()?.toFixed(2)}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function SchemesPage() {
  return (
    <CrudPage
      title="Schemes"
      description="Manage mutual fund schemes"
      service={schemeService}
      columns={columns}
      FormComponent={SchemeForm}
      searchPlaceholder="Search schemes..."
      modalSize="lg"
    />
  );
}

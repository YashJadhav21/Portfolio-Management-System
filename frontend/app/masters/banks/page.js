"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { bankService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";
import StatusBadge from "@/components/ui/StatusBadge";

const schema = z.object({
  name: z.string().min(1, "Bank name is required"),
  code: z.string().min(1, "Bank code is required"),
  status: z.enum(["Active", "Inactive"]),
});

function BankForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", status: "Active" },
  });

  useEffect(() => {
    if (data) reset({ name: data.name, code: data.code, status: data.status });
    else reset({ name: "", code: "", status: "Active" });
  }, [data, reset]);

  const inputClass = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Bank Name *</label>
          <input {...register("name")} className={inputClass} placeholder="e.g. State Bank of India" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Bank Code *</label>
          <input {...register("code")} className={inputClass} placeholder="e.g. SBI" style={{ textTransform: "uppercase" }} />
          {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
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
  { accessorKey: "name", header: "Bank Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "code", header: "Code", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold">{getValue()}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function BanksPage() {
  return (
    <CrudPage
      title="Banks"
      description="Manage banks for fixed deposit tracking"
      service={bankService}
      columns={columns}
      FormComponent={BankForm}
      searchPlaceholder="Search banks..."
    />
  );
}

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { groupService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";
import StatusBadge from "@/components/ui/StatusBadge";

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function GroupForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", description: "", status: "Active" },
  });

  useEffect(() => {
    if (data) reset({ code: data.code || "", name: data.name, description: data.description || "", status: data.status });
    else reset({ code: "", name: "", description: "", status: "Active" });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Group Code</label>
          <input {...register("code")} className={ic} placeholder="e.g. FAM-001" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Group Name *</label>
          <input {...register("name")} className={ic} placeholder="e.g. Sharma Family" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Description</label>
        <textarea {...register("description")} rows={2} className={`${ic} resize-none`} placeholder="Optional description..." />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
        <select {...register("status")} className={ic}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
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
  { accessorKey: "code", header: "Group Code", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold">{getValue() || "—"}</span> },
  { accessorKey: "name", header: "Group Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
  { accessorKey: "description", header: "Description", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorGroupsPage() {
  return (
    <CrudPage
      title="Group (Family) Master"
      description="Manage family groups and their members"
      service={groupService}
      columns={columns}
      FormComponent={GroupForm}
      searchPlaceholder="Search groups..."
    />
  );
}

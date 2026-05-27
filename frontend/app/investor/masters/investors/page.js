"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { investorService, groupService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";
import StatusBadge from "@/components/ui/StatusBadge";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  mobile: z.string().min(10, "Valid mobile required"),
  pan: z.string().min(10, "Valid PAN required").max(10),
  address: z.string().optional(),
  groupId: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function InvestorForm({ data, onSubmit, isLoading, onCancel }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    groupService.getAll({ limit: 100 }).then((r) => setGroups(r.data.data || []));
  }, []);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", mobile: "", pan: "", address: "", groupId: "", status: "Active" },
  });

  useEffect(() => {
    if (data) {
      reset({ name: data.name, email: data.email, mobile: data.mobile, pan: data.pan, address: data.address || "", groupId: data.groupId?._id || data.groupId || "", status: data.status });
    } else {
      reset({ name: "", email: "", mobile: "", pan: "", address: "", groupId: "", status: "Active" });
    }
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Full Name *</label>
          <input {...register("name")} className={ic} placeholder="e.g. Vikas Jain" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Email *</label>
          <input {...register("email")} type="email" className={ic} placeholder="vikas@example.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Mobile *</label>
          <input {...register("mobile")} className={ic} placeholder="9876543210" />
          {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">PAN *</label>
          <input {...register("pan")} className={ic} placeholder="ABCDE1234F" style={{ textTransform: "uppercase" }} />
          {errors.pan && <p className="text-red-400 text-xs mt-1">{errors.pan.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Group (Family)</label>
          <select {...register("groupId")} className={ic}>
            <option value="">Select group...</option>
            {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
          <select {...register("status")} className={ic}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Address</label>
          <textarea {...register("address")} rows={2} className={`${ic} resize-none`} placeholder="Full address..." />
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
  { accessorKey: "name", header: "Investor Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
  { accessorKey: "email", header: "Email", cell: ({ getValue }) => <span className="text-slate-300">{getValue()}</span> },
  { accessorKey: "mobile", header: "Mobile", cell: ({ getValue }) => <span className="font-mono text-slate-300">{getValue()}</span> },
  { accessorKey: "pan", header: "PAN", cell: ({ getValue }) => <span className="font-mono text-emerald-400 font-semibold">{getValue()}</span> },
  { accessorKey: "groupId", header: "Group (Family)", cell: ({ getValue }) => <span className="text-slate-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorInvestorsPage() {
  return (
    <CrudPage
      title="User (Investor) Master"
      description="Manage investor profiles and family group associations"
      service={investorService}
      columns={columns}
      FormComponent={InvestorForm}
      searchPlaceholder="Search investors..."
      modalSize="lg"
    />
  );
}

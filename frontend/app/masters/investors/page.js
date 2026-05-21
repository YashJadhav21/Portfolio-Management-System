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
      reset({
        name: data.name, email: data.email, mobile: data.mobile,
        pan: data.pan, address: data.address || "",
        groupId: data.groupId?._id || data.groupId || "",
        status: data.status,
      });
    } else {
      reset({ name: "", email: "", mobile: "", pan: "", address: "", groupId: "", status: "Active" });
    }
  }, [data, reset]);

  const inputClass = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Full Name *</label>
          <input {...register("name")} className={inputClass} placeholder="e.g. Rajesh Sharma" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Email *</label>
          <input {...register("email")} type="email" className={inputClass} placeholder="email@example.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Mobile *</label>
          <input {...register("mobile")} className={inputClass} placeholder="9876543210" />
          {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">PAN Number *</label>
          <input {...register("pan")} className={inputClass} placeholder="ABCDE1234F" style={{ textTransform: "uppercase" }} />
          {errors.pan && <p className="text-red-400 text-xs mt-1">{errors.pan.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Group</label>
          <select {...register("groupId")} className={inputClass}>
            <option value="">No Group</option>
            {groups.map((g) => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Status</label>
          <select {...register("status")} className={inputClass}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-300 block mb-1.5">Address</label>
        <textarea {...register("address")} rows={2} className={`${inputClass} resize-none`} placeholder="Full address..." />
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
  { accessorKey: "name", header: "Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "mobile", header: "Mobile" },
  { accessorKey: "pan", header: "PAN" },
  { accessorKey: "groupId", header: "Group", cell: ({ getValue }) => <span className="text-slate-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorsPage() {
  return (
    <CrudPage
      title="Investors"
      description="Manage investor profiles and mappings"
      service={investorService}
      columns={columns}
      FormComponent={InvestorForm}
      searchPlaceholder="Search investors..."
      modalSize="lg"
    />
  );
}

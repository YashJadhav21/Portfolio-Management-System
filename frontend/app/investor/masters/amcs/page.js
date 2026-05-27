"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { amcService } from "@/services/api.service";
import CrudPage from "@/components/CrudPage";
import StatusBadge from "@/components/ui/StatusBadge";

const schema = z.object({
  name: z.string().min(1, "AMC name is required"),
  registrationNo: z.string().optional(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

function AMCForm({ data, onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", registrationNo: "", email: "", phone: "", address: "", status: "Active" },
  });

  useEffect(() => {
    if (data) reset({ name: data.name, registrationNo: data.registrationNo || "", email: data.email || "", phone: data.phone || "", address: data.address || "", status: data.status });
    else reset({ name: "", registrationNo: "", email: "", phone: "", address: "", status: "Active" });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-slate-300 block mb-1.5">AMC Name *</label>
          <input {...register("name")} className={ic} placeholder="e.g. SBI Funds Management Limited" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Registration Number</label>
          <input {...register("registrationNo")} className={ic} placeholder="e.g. MF-2001-01" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Phone</label>
          <input {...register("phone")} className={ic} placeholder="1800-XXX-XXXX" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Email</label>
          <input {...register("email")} type="email" className={ic} placeholder="contact@amc.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
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
          <textarea {...register("address")} rows={2} className={`${ic} resize-none`} placeholder="Office address..." />
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
  { accessorKey: "name", header: "AMC Name", cell: ({ getValue }) => <span className="font-semibold text-slate-100">{getValue()}</span> },
  { accessorKey: "registrationNo", header: "Reg. Number", cell: ({ getValue }) => <span className="font-mono text-slate-300 text-xs">{getValue() || "—"}</span> },
  { accessorKey: "phone", header: "Phone", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "email", header: "Email", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorAMCsPage() {
  return (
    <CrudPage
      title="AMC Master"
      description="Asset Management Companies offering mutual fund schemes"
      service={amcService}
      columns={columns}
      FormComponent={AMCForm}
      searchPlaceholder="Search AMCs..."
      modalSize="lg"
    />
  );
}

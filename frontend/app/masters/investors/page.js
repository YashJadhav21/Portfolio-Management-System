"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { investorService, groupService } from "@/services/api.service";
import { investorPortalService } from "@/services/investor-api.service";
import CrudPage from "@/components/CrudPage";
import StatusBadge from "@/components/ui/StatusBadge";
import FormModal from "@/components/ui/FormModal";
import { toast } from "sonner";
import { KeyRound, CheckCircle2, UserPlus } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  mobile: z.string().min(10, "Valid mobile required"),
  pan: z.string().min(10, "Valid PAN required").max(10),
  address: z.string().optional(),
  groupId: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
});

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
          <label className="text-sm font-medium text-slate-300 block mb-1.5">Group (Family)</label>
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

function CreateLoginModal({ investor, isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [checking, setChecking] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (isOpen && investor) {
      setChecking(true);
      // Pre-fill username from investor name
      const suggestedUsername = investor.name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
      reset({ username: suggestedUsername, password: "" });

      investorPortalService.getLoginStatus(investor._id)
        .then((r) => setLoginStatus(r.data.data))
        .catch(() => setLoginStatus(null))
        .finally(() => setChecking(false));
    }
  }, [isOpen, investor, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await investorPortalService.createInvestorLogin(investor._id, data);
      toast.success(`Login created for ${investor.name}! They can now log in with username: ${data.username}`);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create login");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const ic = "w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <FormModal isOpen={isOpen} onClose={onClose} title={`Create Investor Login — ${investor?.name}`} size="md">
      {checking ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loginStatus ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-slate-200 font-semibold text-lg mb-1">Login Already Exists</p>
          <p className="text-slate-400 text-sm mb-4">This investor already has a login account.</p>
          <div className="bg-slate-800/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Username</span>
              <span className="text-slate-200 text-sm font-mono font-medium">{loginStatus.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Email</span>
              <span className="text-slate-200 text-sm">{loginStatus.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Active</span>
              <span className={`text-sm font-medium ${loginStatus.isActive ? "text-emerald-400" : "text-red-400"}`}>
                {loginStatus.isActive ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="mt-4 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Close</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-2">
            <p className="text-blue-300 text-sm">
              Create a login for <span className="font-semibold">{investor?.name}</span>. They will be able to log in and view their own portfolio.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Username *</label>
            <input {...register("username")} className={ic} placeholder="e.g. rajesh.sharma" />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Password *</label>
            <input {...register("password")} type="password" className={ic} placeholder="Min 6 characters" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-slate-400 text-xs">Email (auto-linked): <span className="text-slate-300">{investor?.email}</span></p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
              <UserPlus className="w-4 h-4" /> Create Login
            </button>
          </div>
        </form>
      )}
    </FormModal>
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
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  const extraActions = useCallback((row) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setSelectedInvestor(row.original);
        setLoginModalOpen(true);
      }}
      title="Create / View Login"
      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
    >
      <KeyRound className="w-3.5 h-3.5" />
    </button>
  ), []);

  return (
    <>
      <CrudPage
        title="Investors"
        description="Manage investor profiles and mappings"
        service={investorService}
        columns={columns}
        FormComponent={InvestorForm}
        searchPlaceholder="Search investors..."
        modalSize="lg"
        extraActions={extraActions}
      />
      <CreateLoginModal
        investor={selectedInvestor}
        isOpen={loginModalOpen}
        onClose={() => { setLoginModalOpen(false); setSelectedInvestor(null); }}
      />
    </>
  );
}

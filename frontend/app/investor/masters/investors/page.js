"use client";
import { investorService } from "@/services/api.service";
import InvestorMasterTable from "@/components/investor/InvestorMasterTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Users } from "lucide-react";

const columns = [
  { accessorKey: "name", header: "Investor Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "mobile", header: "Mobile" },
  { accessorKey: "pan", header: "PAN / Investor Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400">{getValue()}</span> },
  { accessorKey: "groupId", header: "Group (Family)", cell: ({ getValue }) => <span className="text-slate-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorInvestorsPage() {
  return (
    <InvestorMasterTable
      title="User (Investor) Master"
      description="View investor profiles and their group associations — Masters / User (Investor) Master"
      service={investorService}
      columns={columns}
      searchPlaceholder="Search investors..."
      icon={Users}
    />
  );
}

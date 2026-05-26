"use client";
import { amcService } from "@/services/api.service";
import InvestorMasterTable from "@/components/investor/InvestorMasterTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Landmark } from "lucide-react";

const columns = [
  { accessorKey: "name", header: "AMC Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "code", header: "AMC Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400">{getValue() || "—"}</span> },
  { accessorKey: "website", header: "Website", cell: ({ getValue }) => getValue() ? <a href={getValue()} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">{getValue()}</a> : <span className="text-slate-500">—</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorAMCsPage() {
  return (
    <InvestorMasterTable
      title="AMC Master"
      description="Asset Management Companies offering mutual fund schemes — Masters / AMC Master"
      service={amcService}
      columns={columns}
      searchPlaceholder="Search AMCs..."
      icon={Landmark}
    />
  );
}

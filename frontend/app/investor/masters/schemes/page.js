"use client";
import { schemeService } from "@/services/api.service";
import InvestorMasterTable from "@/components/investor/InvestorMasterTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { ListTree } from "lucide-react";

const columns = [
  { accessorKey: "name", header: "Scheme Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "code", header: "Scheme Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400">{getValue() || "—"}</span> },
  { accessorKey: "amcId", header: "AMC", cell: ({ getValue }) => <span className="text-slate-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "category", header: "Category", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "nav", header: "NAV (₹)", cell: ({ getValue }) => <span className="text-blue-400 font-mono">{getValue() ? `₹${getValue()?.toFixed(4)}` : "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorSchemesPage() {
  return (
    <InvestorMasterTable
      title="Scheme Master"
      description="Mutual fund schemes available for investment — Masters / Scheme Master"
      service={schemeService}
      columns={columns}
      searchPlaceholder="Search schemes..."
      icon={ListTree}
    />
  );
}

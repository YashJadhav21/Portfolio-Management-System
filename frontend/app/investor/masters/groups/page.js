"use client";
import { groupService } from "@/services/api.service";
import InvestorMasterTable from "@/components/investor/InvestorMasterTable";
import { Users } from "lucide-react";

const columns = [
  { accessorKey: "name", header: "Family Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "code", header: "Group Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400">{getValue() || "—"}</span> },
  { accessorKey: "description", header: "Description", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
];

export default function InvestorGroupsPage() {
  return (
    <InvestorMasterTable
      title="Group (Family) Master"
      description="View all family/group records — Masters / Group Master"
      service={groupService}
      columns={columns}
      searchPlaceholder="Search groups..."
      icon={Users}
    />
  );
}

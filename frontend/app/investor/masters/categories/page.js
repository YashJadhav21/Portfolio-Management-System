"use client";
import { categoryService } from "@/services/api.service";
import InvestorMasterTable from "@/components/investor/InvestorMasterTable";
import { FolderTree } from "lucide-react";

const columns = [
  { accessorKey: "name", header: "Category Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "code", header: "Category Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400">{getValue() || "—"}</span> },
  { accessorKey: "description", header: "Description", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
];

export default function InvestorCategoriesPage() {
  return (
    <InvestorMasterTable
      title="Category Master"
      description="Asset categories: Fixed Income Securities, Mutual Funds, Shares, Insurance — Masters / Category Master"
      service={categoryService}
      columns={columns}
      searchPlaceholder="Search categories..."
      icon={FolderTree}
    />
  );
}

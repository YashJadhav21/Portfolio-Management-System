"use client";
import { subcategoryService } from "@/services/api.service";
import InvestorMasterTable from "@/components/investor/InvestorMasterTable";
import { Tags } from "lucide-react";

const columns = [
  { accessorKey: "name", header: "Sub-Category Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "code", header: "Sub-Category Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400">{getValue() || "—"}</span> },
  { accessorKey: "categoryId", header: "Category", cell: ({ getValue }) => <span className="text-slate-400">{getValue()?.name || "—"}</span> },
  { accessorKey: "description", header: "Description", cell: ({ getValue }) => <span className="text-slate-400 text-xs">{getValue() || "—"}</span> },
];

export default function InvestorSubcategoriesPage() {
  return (
    <InvestorMasterTable
      title="Sub-Category Master"
      description="Sub-categories under each asset class (e.g. BNFD, CNFD, Dividend, Growth, Equity...) — Masters / Sub-Category Master"
      service={subcategoryService}
      columns={columns}
      searchPlaceholder="Search sub-categories..."
      icon={Tags}
    />
  );
}

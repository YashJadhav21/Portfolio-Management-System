"use client";
import { useState, useEffect, useCallback } from "react";
import { companyService, bankService } from "@/services/api.service";
import InvestorMasterTable from "@/components/investor/InvestorMasterTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { Building2 } from "lucide-react";

const companyColumns = [
  { accessorKey: "name", header: "Company Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "symbol", header: "Symbol", cell: ({ getValue }) => <span className="font-mono text-blue-400 font-semibold">{getValue()}</span> },
  {
    accessorKey: "exchange", header: "Exchange",
    cell: ({ getValue }) => {
      const ex = getValue() || "—";
      const color = ex === "BSE" ? "text-orange-400 bg-orange-500/10" : ex === "NSE" ? "text-blue-400 bg-blue-500/10" : "text-purple-400 bg-purple-500/10";
      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${color}`}>{ex}</span>;
    }
  },
  { accessorKey: "sector", header: "Sector", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

const bankColumns = [
  { accessorKey: "name", header: "Bank Name", cell: ({ getValue }) => <span className="font-medium text-slate-200">{getValue()}</span> },
  { accessorKey: "code", header: "IFSC / Code", cell: ({ getValue }) => <span className="font-mono text-emerald-400">{getValue() || "—"}</span> },
  { accessorKey: "branch", header: "Branch", cell: ({ getValue }) => <span className="text-slate-400">{getValue() || "—"}</span> },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => <StatusBadge status={getValue()} /> },
];

export default function InvestorCompaniesPage() {
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-slate-800">
        {[{ id: "companies", label: "Companies (Stocks)" }, { id: "banks", label: "Banks" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all ${activeTab === tab.id
              ? "bg-emerald-600/20 text-emerald-400 border-b-2 border-emerald-500"
              : "text-slate-400 hover:text-slate-200"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "companies" ? (
        <InvestorMasterTable
          title="Company / Bank Master — Companies"
          description="Listed companies available for share transactions — Masters / Company/Bank Master"
          service={companyService}
          columns={companyColumns}
          searchPlaceholder="Search companies..."
          icon={Building2}
        />
      ) : (
        <InvestorMasterTable
          title="Company / Bank Master — Banks"
          description="Banks available for fixed income / FD transactions — Masters / Company/Bank Master"
          service={bankService}
          columns={bankColumns}
          searchPlaceholder="Search banks..."
          icon={Building2}
        />
      )}
    </div>
  );
}

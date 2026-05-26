"use client";

import { Shield, Construction } from "lucide-react";

export default function InvestorInsurancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Insurance</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your insurance policies and coverage</p>
      </div>

      <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center border border-amber-500/20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Insurance Module</h2>
        <p className="text-slate-400 text-sm max-w-md mb-4">
          The insurance module covers Endowment, ULIP, Term Insurance, and Retirement/Pension policies.
        </p>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Construction className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">Coming Soon</span>
        </div>

        {/* Sub-categories reference */}
        <div className="mt-8 grid grid-cols-2 gap-3 text-left w-full max-w-sm">
          {["Endowment", "ULIP", "Term Insurance", "Retirement / Pension"].map((type) => (
            <div key={type} className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-300 text-sm">{type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { investorPortalService } from "@/services/investor-api.service";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Banknote,
  BarChart2,
  Shield,
  Users,
  Plus,
  Minus,
  Wallet,
  ChevronRight,
} from "lucide-react";

/* ── Sub-category definitions ─────────────────────────────── */
const SUBCATEGORIES = {
  "Fixed Income Securities": [
    "BNFD", "CNFD", "BCFD", "CCFD", "CD", "NCD", "PMIS", "PTD", "Insurance Annuity",
  ],
  "Mutual Funds": ["Dividend", "Growth"],
  "Stocks": ["Co-operative Bank", "Preference", "Equity"],
  "Insurance": ["Endowment", "ULIP", "Term Insurance", "Retirement / Pension"],
};

const ASSET_ICONS = {
  "Fixed Income Securities": Banknote,
  "Mutual Funds": TrendingUp,
  "Stocks": BarChart2,
  "Insurance": Shield,
};

const ASSET_COLORS = {
  "Fixed Income Securities": { text: "text-blue-400", bg: "bg-blue-500/10", badge: "bg-blue-500/15 text-blue-300" },
  "Mutual Funds": { text: "text-purple-400", bg: "bg-purple-500/10", badge: "bg-purple-500/15 text-purple-300" },
  "Stocks": { text: "text-emerald-400", bg: "bg-emerald-500/10", badge: "bg-emerald-500/15 text-emerald-300" },
  "Insurance": { text: "text-amber-400", bg: "bg-amber-500/10", badge: "bg-amber-500/15 text-amber-300" },
};

/* ── Subcategory Row ──────────────────────────────────────── */
function SubcategoryRow({ name, colors }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-2 py-1.5 px-3 ml-10 mr-4 rounded-lg hover:bg-slate-800/40 transition-colors"
    >
      <ChevronRight className={`w-3 h-3 shrink-0 ${colors.text} opacity-60`} />
      <span className="text-slate-400 text-xs flex-1">{name}</span>
      <div className="text-right min-w-[90px]">
        <p className="text-slate-500 text-xs">—</p>
      </div>
      <div className="text-right min-w-[90px]">
        <p className="text-slate-500 text-xs">—</p>
      </div>
    </motion.div>
  );
}

/* ── Asset Row (Fixed Income / MF / Stocks / Insurance) ───── */
function AssetRow({ label, invested, marketValue }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ASSET_ICONS[label] || Wallet;
  const colors = ASSET_COLORS[label] || { text: "text-slate-400", bg: "bg-slate-500/10", badge: "bg-slate-500/15 text-slate-300" };
  const gain = (marketValue || 0) - (invested || 0);
  const subcats = SUBCATEGORIES[label] || [];

  return (
    <div>
      {/* Main asset row */}
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-800/30 transition-colors group">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
            expanded ? colors.badge : "bg-slate-700/60 text-slate-500"
          } hover:${colors.badge}`}
          title={expanded ? "Collapse sub-categories" : "Expand sub-categories"}
        >
          {expanded ? (
            <Minus className="w-3 h-3" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
        </button>

        {/* Icon + Label */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        </div>
        <span className="flex-1 text-slate-300 text-sm font-medium">{label}</span>

        {/* Amount Invested */}
        <div className="text-right min-w-[90px]">
          <p className="text-slate-200 text-sm font-semibold">{formatCurrency(invested || 0)}</p>
          <p className="text-slate-500 text-xs">invested</p>
        </div>

        {/* Market Value */}
        <div className="text-right min-w-[90px]">
          <p className="text-emerald-400 text-sm font-bold">{formatCurrency(marketValue || 0)}</p>
          <p className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {gain >= 0 ? "+" : ""}{formatCurrency(gain)}
          </p>
        </div>
      </div>

      {/* Sub-categories */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            {subcats.map((sub) => (
              <SubcategoryRow key={sub} name={sub} colors={colors} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Member Row ───────────────────────────────────────────── */
function MemberRow({ member, isCurrentUser }) {
  const [expanded, setExpanded] = useState(isCurrentUser);

  const assets = [
    { label: "Fixed Income Securities", invested: member.fixedIncome?.invested, marketValue: member.fixedIncome?.marketValue },
    { label: "Mutual Funds", invested: member.mutualFunds?.invested, marketValue: member.mutualFunds?.marketValue },
    { label: "Stocks", invested: member.shares?.invested, marketValue: member.shares?.marketValue },
    { label: "Insurance", invested: member.insurance?.invested, marketValue: member.insurance?.marketValue },
  ];

  const gain = (member.totalMarketValue || 0) - (member.totalInvested || 0);

  return (
    <div className="border-b border-slate-800/50 last:border-0">
      {/* Member header row — +/- on FAR LEFT like asset rows */}
      <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/20 transition-colors group">
        {/* Expand toggle — LEFT */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
            expanded ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/60 text-slate-500"
          } hover:bg-emerald-500/20 hover:text-emerald-400`}
        >
          {expanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${isCurrentUser ? "bg-emerald-400" : "bg-slate-600"}`} />

        {/* Name — clicking name also toggles */}
        <span
          onClick={() => setExpanded(!expanded)}
          className={`flex-1 text-sm font-semibold cursor-pointer ${isCurrentUser ? "text-emerald-300" : "text-slate-300"}`}
        >
          {member.name}
          {isCurrentUser && (
            <span className="ml-2 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">You</span>
          )}
        </span>

        {/* Invested */}
        <div className="text-right min-w-[90px]">
          <p className="text-slate-100 text-sm font-bold">{formatCurrency(member.totalInvested || 0)}</p>
        </div>
        {/* Market Value */}
        <div className="text-right min-w-[90px]">
          <p className="text-emerald-400 text-sm font-bold">{formatCurrency(member.totalMarketValue || 0)}</p>
          <p className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {gain >= 0 ? "+" : ""}{formatCurrency(gain)}
          </p>
        </div>
      </div>

      {/* Asset rows */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mr-2 mb-3 border-l border-slate-800/60 pl-3 space-y-0">
              {assets.map((asset) => (
                <AssetRow key={asset.label} {...asset} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Family Tree ──────────────────────────────────────────── */
function FamilyTree({ treeData, loading }) {
  const [groupExpanded, setGroupExpanded] = useState(true);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!treeData) return null;

  const { group, members, totals } = treeData;
  const totalGain = (totals?.marketValue || 0) - (totals?.invested || 0);

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setGroupExpanded(!groupExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-900/20 hover:from-emerald-500/15 hover:to-teal-500/15 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-emerald-300 font-semibold text-sm">Family ({group?.name})</p>
          <p className="text-slate-500 text-xs">{members?.length || 0} member{members?.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="text-slate-500 hover:text-slate-300 transition-colors">
          {groupExpanded ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/50">
        <div className="w-7 shrink-0" /> {/* spacer for +/- button */}
        <span className="flex-1 text-slate-500 text-xs font-semibold uppercase tracking-wider">Member / Asset</span>
        <div className="min-w-[90px] text-right text-slate-500 text-xs font-semibold uppercase tracking-wider">Invested</div>
        <div className="min-w-[90px] text-right text-slate-500 text-xs font-semibold uppercase tracking-wider">Market Val.</div>
        <div className="w-5 shrink-0" />
      </div>

      {/* Group Totals row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/30 border-b border-slate-800/60">
        <div className="w-7 shrink-0" />
        <span className="flex-1 text-slate-400 text-xs font-semibold uppercase tracking-wider">Family Total</span>
        <div className="min-w-[90px] text-right">
          <p className="text-slate-100 text-sm font-bold">{formatCurrency(totals?.invested || 0)}</p>
        </div>
        <div className="min-w-[90px] text-right">
          <p className="text-emerald-400 text-sm font-bold">{formatCurrency(totals?.marketValue || 0)}</p>
          <p className={`text-xs ${totalGain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
          </p>
        </div>
      </div>

      {/* Members */}
      <AnimatePresence>
        {groupExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {members?.map((member) => (
              <MemberRow key={member._id} member={member} isCurrentUser={member.isCurrentUser} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Dashboard Page ──────────────────────────────────── */
export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const [treeData, setTreeData] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      investorPortalService.getGroupTree(),
      investorPortalService.getDashboard(),
    ])
      .then(([tree, dash]) => {
        setTreeData(tree.data.data);
        setDashData(dash.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = dashData?.stats || {};

  const cards = [
    {
      label: "Total Invested",
      value: stats.totalInvested || 0,
      marketValue: stats.totalMarketValue || 0,
      icon: Wallet,
      gradient: "from-emerald-500 to-teal-600",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
    {
      label: "Fixed Income",
      value: stats.fixedIncome?.invested || 0,
      marketValue: stats.fixedIncome?.marketValue || 0,
      icon: Banknote,
      gradient: "from-blue-500 to-blue-700",
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
    },
    {
      label: "Mutual Funds",
      value: stats.mutualFunds?.invested || 0,
      marketValue: stats.mutualFunds?.marketValue || 0,
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-700",
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
    },
    {
      label: "Shares",
      value: stats.shares?.invested || 0,
      marketValue: stats.shares?.marketValue || 0,
      icon: BarChart2,
      gradient: "from-amber-500 to-orange-600",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Portfolio Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Welcome back, <span className="text-emerald-400 font-semibold">{user?.username}</span>! Here&apos;s your portfolio overview.
        </p>
      </div>

      {/* Stat Cards — Total Invested + Market Value in each card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {cards.map((card) => {
          const mv = card.marketValue;
          const gain = mv - card.value;
          return (
            <div key={card.label} className={`glass-card rounded-2xl p-5 border ${card.border} ${card.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="text-xl font-bold text-slate-100">{formatCurrency(card.value)}</p>
                  <p className="text-emerald-400 text-sm font-semibold mt-0.5">
                    +{formatCurrency(mv)}
                  </p>
                  {mv > 0 && (
                    <p className={`text-xs mt-0.5 ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {gain >= 0 ? "▲" : "▼"} {gain >= 0 ? "+" : ""}{formatCurrency(gain)} P&amp;L
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Portfolio Structure — Family Tree */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Portfolio Structure</h2>
        <FamilyTree treeData={treeData} loading={loading} />
      </div>
    </div>
  );
}

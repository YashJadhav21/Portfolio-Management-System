"use client";

import { useState, useEffect } from "react";
import { investorPortalService } from "@/services/investor-api.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/store/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Banknote,
  BarChart2,
  Shield,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Wallet,
} from "lucide-react";

const ASSET_ICONS = {
  "Fixed Income Securities": Banknote,
  "Mutual Funds": TrendingUp,
  "Stocks": BarChart2,
  "Insurance": Shield,
};

const ASSET_COLORS = {
  "Fixed Income Securities": "text-blue-400 bg-blue-500/10",
  "Mutual Funds": "text-purple-400 bg-purple-500/10",
  "Stocks": "text-emerald-400 bg-emerald-500/10",
  "Insurance": "text-amber-400 bg-amber-500/10",
};

function AssetRow({ label, invested, marketValue }) {
  const Icon = ASSET_ICONS[label] || Wallet;
  const colorClass = ASSET_COLORS[label] || "text-slate-400 bg-slate-500/10";
  const gain = marketValue - invested;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-800/30 transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-slate-300 text-sm">{label}</span>
      <div className="text-right min-w-[100px]">
        <p className="text-slate-200 text-sm font-medium">{formatCurrency(invested)}</p>
        <p className="text-slate-500 text-xs">invested</p>
      </div>
      <div className="text-right min-w-[100px]">
        <p className="text-emerald-400 text-sm font-semibold">{formatCurrency(marketValue)}</p>
        <p className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
          {gain >= 0 ? "+" : ""}{formatCurrency(gain)}
        </p>
      </div>
    </motion.div>
  );
}

function MemberRow({ member, isCurrentUser }) {
  const [expanded, setExpanded] = useState(isCurrentUser);

  const assets = [
    { label: "Fixed Income Securities", ...member.fixedIncome },
    { label: "Mutual Funds", ...member.mutualFunds },
    { label: "Stocks", ...member.shares },
    { label: "Insurance", ...member.insurance },
  ];

  const gain = member.totalMarketValue - member.totalInvested;

  return (
    <div className="border-b border-slate-800/50 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-800/20 transition-colors group"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${isCurrentUser ? "bg-emerald-400" : "bg-slate-600"}`} />
        <span className={`flex-1 text-left text-sm font-medium ${isCurrentUser ? "text-emerald-300" : "text-slate-300"}`}>
          {member.name}
          {isCurrentUser && <span className="ml-2 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">You</span>}
        </span>
        <div className="text-right mr-4 min-w-[100px]">
          <p className="text-slate-200 text-sm font-medium">{formatCurrency(member.totalInvested)}</p>
        </div>
        <div className="text-right mr-2 min-w-[100px]">
          <p className="text-emerald-400 text-sm font-semibold">{formatCurrency(member.totalMarketValue)}</p>
          <p className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
            {gain >= 0 ? "+" : ""}{formatCurrency(gain)}
          </p>
        </div>
        <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {expanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="ml-8 mr-4 mb-2 space-y-0.5 border-l border-slate-800 pl-4">
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

function FamilyTree({ treeData, loading }) {
  const [expanded, setExpanded] = useState(true);

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
  const totalGain = totals.marketValue - totals.invested;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-900/20 hover:from-emerald-500/15 hover:to-teal-500/15 transition-colors group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-emerald-300 font-semibold text-sm">Family ({group.name})</p>
          <p className="text-slate-500 text-xs">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {/* Column headers */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold uppercase tracking-wider mr-2">
          <div className="min-w-[100px] text-right">Amount Invested</div>
          <div className="min-w-[100px] text-right">Market Value</div>
        </div>
        <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
      </button>

      {/* Group Totals */}
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/40 border-b border-slate-800/50">
        <div className="w-9 shrink-0" />
        <span className="flex-1 text-slate-500 text-xs font-medium uppercase tracking-wider">Total</span>
        <div className="hidden sm:flex items-center gap-2">
          <div className="min-w-[100px] text-right">
            <p className="text-slate-200 text-sm font-bold">{formatCurrency(totals.invested)}</p>
          </div>
          <div className="min-w-[100px] text-right">
            <p className="text-emerald-400 text-sm font-bold">{formatCurrency(totals.marketValue)}</p>
            <p className={`text-xs ${totalGain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {totalGain >= 0 ? "+" : ""}{formatCurrency(totalGain)}
            </p>
          </div>
          <div className="w-4" />
        </div>
      </div>

      {/* Column Header Row */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-900/20 border-b border-slate-800/30">
        <div className="w-2 shrink-0" />
        <div className="w-2 shrink-0" />
        <span className="flex-1 text-slate-600 text-xs uppercase tracking-wider">Member</span>
        <div className="min-w-[100px] text-right text-slate-600 text-xs uppercase tracking-wider">Invested</div>
        <div className="min-w-[100px] text-right text-slate-600 text-xs uppercase tracking-wider mr-2">Market Val.</div>
        <div className="w-4" />
      </div>

      {/* Members */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {members.map((member) => (
              <MemberRow
                key={member._id}
                member={member}
                isCurrentUser={member.isCurrentUser}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function InvestorDashboardPage() {
  const { user } = useAuth();
  const [treeData, setTreeData] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      investorPortalService.getGroupTree(),
      investorPortalService.getDashboard(),
    ]).then(([tree, dash]) => {
      setTreeData(tree.data.data);
      setDashData(dash.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = dashData?.stats || {};
  const recentFD = dashData?.recentActivity?.fd || [];
  const recentMF = dashData?.recentActivity?.mf || [];
  const recentAll = [...recentFD, ...recentMF]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Portfolio Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Welcome back, <span className="text-emerald-400 font-medium">{user?.username}</span>! Here's your portfolio overview.
        </p>
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Total Invested",
            value: loading ? "—" : formatCurrency(stats.totalInvested || 0),
            icon: Wallet,
            color: "from-emerald-500 to-teal-600",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
          {
            label: "Fixed Income",
            value: loading ? "—" : formatCurrency(stats.fixedIncome?.invested || 0),
            icon: Banknote,
            color: "from-blue-500 to-blue-700",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Mutual Funds",
            value: loading ? "—" : formatCurrency(stats.mutualFunds?.invested || 0),
            icon: TrendingUp,
            color: "from-purple-500 to-purple-700",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
          {
            label: "Shares",
            value: loading ? "—" : formatCurrency(stats.shares?.invested || 0),
            icon: BarChart2,
            color: "from-amber-500 to-orange-600",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`glass-card rounded-2xl p-5 border ${card.bg}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                {card.label}
              </p>
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}
              >
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            {loading ? (
              <div className="h-7 bg-slate-800 rounded animate-pulse" />
            ) : (
              <p className="text-xl font-bold text-slate-100">{card.value}</p>
            )}
          </div>
        ))}
      </motion.div>

      {/* Family Portfolio Tree */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Portfolio Structure
        </h2>
        <FamilyTree treeData={treeData} loading={loading} />
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-slate-800 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-800 rounded w-1/3" />
                </div>
                <div className="h-4 bg-slate-800 rounded w-20" />
              </div>
            ))}
          </div>
        ) : recentAll.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            No recent activity yet
          </div>
        ) : (
          <div className="space-y-2">
            {recentAll.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type.includes("Purchase") || item.type === "Fixed Income"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-orange-500/15 text-orange-400"
                  }`}
                >
                  {item.type.includes("Purchase") || item.type === "Fixed Income" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">
                    {item.type}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {item.bank || item.scheme || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-slate-200 text-sm font-medium">{formatCurrency(item.amount)}</p>
                  <p className="text-slate-600 text-xs">{formatDate(item.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { dashboardService } from "@/services/api.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import StatsCard from "@/components/dashboard/StatsCard";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Wallet,
  TrendingUp,
  Landmark,
  BarChart2,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function ChartCard({ title, children, loading }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">{title}</h3>
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
        {label && <p className="text-slate-400 mb-1">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStats();
        setData(res.data.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = data?.stats || {};

  // Process monthly trend data for chart
  const monthlyData = (() => {
    const map = {};
    data?.monthlyTrend?.mf?.forEach((m) => {
      const key = `${MONTHS[m._id.month - 1]} ${m._id.year}`;
      if (!map[key]) map[key] = { month: key, "Mutual Funds": 0, "Fixed Deposits": 0 };
      map[key]["Mutual Funds"] = m.amount;
    });
    data?.monthlyTrend?.fd?.forEach((m) => {
      const key = `${MONTHS[m._id.month - 1]} ${m._id.year}`;
      if (!map[key]) map[key] = { month: key, "Mutual Funds": 0, "Fixed Deposits": 0 };
      map[key]["Fixed Deposits"] = m.amount;
    });
    return Object.values(map).slice(-6);
  })();

  // Recent transactions combined
  const recentActivity = [
    ...(data?.recentActivity?.fd || []),
    ...(data?.recentActivity?.mf || []),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Welcome back! Here's your portfolio overview.</p>
      </div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <StatsCard
          title="Total Investors"
          value={loading ? "—" : stats.totalInvestors || 0}
          subtitle={`${stats.totalGroups || 0} groups`}
          icon={Users}
          variant="blue"
          loading={loading}
        />
        <StatsCard
          title="Total Portfolio"
          value={loading ? "—" : formatCurrency(stats.totalPortfolio)}
          subtitle="All assets combined"
          icon={Wallet}
          variant="purple"
          loading={loading}
        />
        <StatsCard
          title="Mutual Funds"
          value={loading ? "—" : formatCurrency(stats.totalMF)}
          subtitle="Net invested"
          icon={TrendingUp}
          variant="emerald"
          loading={loading}
        />
        <StatsCard
          title="Fixed Deposits"
          value={loading ? "—" : formatCurrency(stats.totalFD)}
          subtitle="Active deposits"
          icon={Landmark}
          variant="amber"
          loading={loading}
        />
        <StatsCard
          title="Shares"
          value={loading ? "—" : formatCurrency(stats.totalShares)}
          subtitle="Net invested"
          icon={BarChart2}
          variant="rose"
          loading={loading}
        />
        <StatsCard
          title="Active AMCs"
          value={loading ? "—" : stats.totalAMCs || 0}
          subtitle={`${stats.totalSchemes || 0} schemes`}
          icon={Building2}
          variant="cyan"
          loading={loading}
        />
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Asset Allocation Pie */}
        <ChartCard title="Asset Allocation" loading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data?.assetAllocation || []}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
              >
                {(data?.assetAllocation || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-slate-400 text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Investment Trend */}
        <ChartCard title="Monthly Investment Trend (Last 6 Months)" loading={loading}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span className="text-slate-400 text-xs">{v}</span>} />
              <Bar dataKey="Mutual Funds" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Fixed Deposits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AMC Distribution */}
        <ChartCard title="AMC-wise Distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data?.amcDistribution || []}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
              >
                {(data?.amcDistribution || []).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {(data?.amcDistribution || []).slice(0, 4).map((amc, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-400 truncate max-w-[120px]">{amc.name}</span>
                </div>
                <span className="text-slate-300 font-medium">{formatCurrency(amc.value)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
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
          ) : recentActivity.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              No recent activity
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type.includes("Purchase") || item.type.includes("FD")
                        ? "bg-green-500/15 text-green-400"
                        : "bg-orange-500/15 text-orange-400"
                    }`}
                  >
                    {item.type.includes("Purchase") || item.type.includes("FD") ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm font-medium truncate">{item.investor}</p>
                    <p className="text-slate-500 text-xs">
                      {item.type} · {item.bank || item.scheme || "—"}
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
    </div>
  );
}

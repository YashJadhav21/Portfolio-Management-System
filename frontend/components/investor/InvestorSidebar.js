"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Banknote,
  TrendingUp,
  BarChart2,
  FileBarChart,
  ChevronDown,
  ChevronRight,
  LineChart,
  LogOut,
  X,
  Shield,
  BookOpen,
  Users,
  FolderTree,
  Tags,
  Building2,
  Landmark,
  ListTree,
} from "lucide-react";
import { useState } from "react";

const investorNavItems = [
  {
    label: "My Dashboard",
    href: "/investor/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    icon: TrendingUp,
    children: [
      { label: "Fixed Income", href: "/investor/transactions/fixed-income", icon: Banknote },
      { label: "Mutual Funds", href: "/investor/transactions/mutual-funds", icon: TrendingUp },
      { label: "Shares", href: "/investor/transactions/shares", icon: BarChart2 },
      { label: "Insurance", href: "/investor/transactions/insurance", icon: Shield },
    ],
  },
  {
    label: "Masters",
    icon: BookOpen,
    children: [
      { label: "Group (Family) Master", href: "/investor/masters/groups", icon: Users },
      { label: "User (Investor) Master", href: "/investor/masters/investors", icon: Users },
      { label: "Asset Class Master", href: "/investor/masters/categories", icon: FolderTree },
      { label: "Asset Sub Class Master", href: "/investor/masters/subcategories", icon: Tags },
      { label: "Company / Bank Master", href: "/investor/masters/companies", icon: Building2 },
      { label: "AMC Master", href: "/investor/masters/amcs", icon: Landmark },
      { label: "Scheme Master", href: "/investor/masters/schemes", icon: ListTree },
    ],
  },
  {
    label: "Reports",
    href: "/investor/reports",
    icon: FileBarChart,
  },
];

function InvestorNavItem({ item }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => pathname.startsWith(c.href))
  );

  const isActive = item.href
    ? pathname === item.href
    : item.children?.some((c) => pathname.startsWith(c.href));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
            isActive
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          )}
        >
          <item.icon
            className={cn(
              "w-5 h-5 shrink-0",
              isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
            )}
          />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                      pathname === child.href
                        ? "text-emerald-400 bg-emerald-500/10 font-medium"
                        : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                    )}
                  >
                    <child.icon className="w-4 h-4 shrink-0" />
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
        isActive
          ? "text-emerald-400 bg-emerald-500/10"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
      )}
    >
      <item.icon
        className={cn(
          "w-5 h-5 shrink-0",
          isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

export default function InvestorSidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#080d1a] border-r border-emerald-900/30 z-50 flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-emerald-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <LineChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-100 text-sm">My Portfolio</p>
              <p className="text-slate-500 text-xs">Investor Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {investorNavItems.map((item) => (
            <InvestorNavItem key={item.label} item={item} />
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-emerald-900/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.username?.[0]?.toUpperCase() || "I"}
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-200 text-sm font-medium truncate">{user?.username}</p>
              <p className="text-emerald-500 text-xs truncate">Investor Account</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 group-hover:text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

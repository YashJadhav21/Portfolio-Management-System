"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/AuthContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Tag,
  Tags,
  Building2,
  Landmark,
  BookOpen,
  Banknote,
  TrendingUp,
  BarChart2,
  FileBarChart,
  ChevronDown,
  ChevronRight,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Masters",
    icon: FolderOpen,
    children: [
      { 
        label: "Groups", 
        href: "/masters/groups", 
        icon: Users,
        subItems: [
          { label: "Investors", href: "/masters/investors", icon: Users }
        ]
      },
      { 
        label: "Categories", 
        href: "/masters/categories", 
        icon: Tag,
        subItems: [
          { label: "Subcategories", href: "/masters/subcategories", icon: Tags }
        ]
      },
      { label: "Companies", href: "/masters/companies", icon: Building2 },
      { label: "Banks", href: "/masters/banks", icon: Landmark },
      { label: "AMCs", href: "/masters/amcs", icon: Landmark },
      { label: "Schemes", href: "/masters/schemes", icon: BookOpen },
    ],
  },
  {
    label: "Transactions",
    icon: TrendingUp,
    children: [
      { label: "Fixed Income", href: "/transactions/fixed-deposits", icon: Banknote },
      { label: "Mutual Funds", href: "/transactions/mutual-funds", icon: TrendingUp },
      { label: "Shares", href: "/transactions/shares", icon: BarChart2 },
    ],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart,
  },
];

function NavItem({ item, collapsed }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() =>
    item.children?.some((c) => pathname.startsWith(c.href))
  );

  const isActive = item.href ? pathname === item.href : item.children?.some((c) => pathname.startsWith(c.href));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
            isActive
              ? "text-blue-400 bg-blue-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          )}
        >
          <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
          {!collapsed && (
            <>
            <span className="flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </>
        )}
      </button>
      <AnimatePresence>
        {open && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
              {item.children.map((child) => (
                <div key={child.label || child.href}>
                  <Link
                    href={child.href || "#"}
                    onClick={child.subItems ? (e) => { e.preventDefault(); child.onClick && child.onClick(); } : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                      (pathname === child.href || (child.subItems && child.subItems.some(s => pathname === s.href)))
                        ? "text-blue-400 bg-blue-500/10 font-medium"
                        : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                    )}
                  >
                    <child.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{child.label}</span>
                    {child.subItems && <ChevronRight className="w-3 h-3" />}
                  </Link>
                  {child.subItems && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">
                      {child.subItems.map(subItem => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150",
                            pathname === subItem.href
                              ? "text-blue-400 bg-blue-500/10 font-medium"
                              : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
                          )}
                        >
                          <subItem.icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{subItem.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
          ? "sidebar-active"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
      )}
    >
      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#080d1a] border-r border-slate-800/60 z-50 flex flex-col transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-100 text-sm">PMS</p>
              <p className="text-slate-500 text-xs">Portfolio Manager</p>
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
          {navItems.map((item) => (
            <NavItem key={item.label} item={item} collapsed={false} />
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-slate-800/60 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-slate-200 text-sm font-medium truncate">{user?.username || "Admin"}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email || "admin@pms.com"}</p>
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

"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, Search } from "lucide-react";

function getBreadcrumb(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((part, i) => ({
    label: part
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    href: "/" + parts.slice(0, i + 1).join("/"),
    isLast: i === parts.length - 1,
  }));
}

export default function Header({ onMenuClick }) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080d1a]/80 backdrop-blur-md border-b border-slate-800/60 flex items-center px-4 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm flex-1">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2">
            {i > 0 && <span className="text-slate-600">/</span>}
            <span
              className={
                crumb.isLast
                  ? "text-slate-200 font-medium"
                  : "text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

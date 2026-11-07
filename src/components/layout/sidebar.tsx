"use client";

import { ClipboardList, FileBarChart, LayoutDashboard, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavigation, type NavItem } from "@/lib/navigation";

const icons: Record<NavItem["icon"], LucideIcon> = {
  overview: LayoutDashboard,
  clients: Users,
  audits: ClipboardList,
  reports: FileBarChart,
};

type SidebarProps = {
  open: boolean;
  onNavigate: () => void;
};

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={open ? "cs-sidebar is-open" : "cs-sidebar"} aria-label="Admin">
      <div className="cs-sidebar-brand">
        <p className="cs-sidebar-brand-mark">EDGELINK</p>
        <p className="cs-caption">SEO Automation</p>
      </div>
      <nav className="cs-sidebar-nav" aria-label="Primary">
        <p className="cs-caption cs-sidebar-label">Admin</p>
        {adminNavigation.map((item) => {
          const Icon = icons[item.icon];
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          if (!item.available || !item.href) {
            return (
              <span key={item.label} className="cs-nav-disabled" aria-disabled="true" title="This section is not built yet">
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={active ? "cs-nav-link is-active" : "cs-nav-link"}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="cs-sidebar-footer">
        <p className="cs-caption">Internal admin portal</p>
      </div>
    </aside>
  );
}

export type NavItem = {
  label: string;
  href?: string;
  icon: "overview" | "clients" | "audits" | "reports";
  available: boolean;
};

export const adminNavigation: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "overview", available: true },
  { label: "Clients", href: "/clients", icon: "clients", available: true },
  { label: "Audits", href: "/audits", icon: "audits", available: true },
  { label: "Reports", href: "/reports", icon: "reports", available: true },
];

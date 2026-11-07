"use client";

import { useState, type ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellProps = {
  title: string;
  children: ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="cs-shell">
      {open ? (
        <button className="cs-backdrop" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />
      ) : null}
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className="cs-shell-main">
        <Header title={title} onMenu={() => setOpen(true)} />
        <main className="cs-content">{children}</main>
      </div>
    </div>
  );
}

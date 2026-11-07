"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

type HeaderProps = {
  title: string;
  onMenu: () => void;
};

export function Header({ title, onMenu }: HeaderProps) {
  return (
    <header className="cs-header">
      <Button
        className="cs-menu-button cs-btn-icon"
        variant="ghost"
        aria-label="Open navigation"
        onClick={onMenu}
      >
        <Menu size={18} aria-hidden="true" />
      </Button>
      <div className="cs-header-title">
        <p className="cs-caption">EDGELINK TECHNOLOGY</p>
        <p className="cs-body">{title}</p>
      </div>
    </header>
  );
}

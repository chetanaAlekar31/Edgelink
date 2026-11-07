"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type DialogContentProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const Dialog = DialogPrimitive.Root;

export function DialogContent({ title, description, children }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="cs-overlay" />
      <DialogPrimitive.Content className="cs-dialog">
        <div className="cs-dialog-header">
          <div className="cs-dialog-copy">
            <DialogPrimitive.Title className="cs-card-title">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="cs-caption">{description}</DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" className="cs-btn-icon" aria-label="Close">
              <X size={18} aria-hidden="true" />
            </Button>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

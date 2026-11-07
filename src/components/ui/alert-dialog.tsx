"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";

type AlertDialogContentProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogContent({ title, description, children }: AlertDialogContentProps) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="cs-overlay" />
      <AlertDialogPrimitive.Content className="cs-dialog">
        <div className="cs-dialog-copy">
          <AlertDialogPrimitive.Title className="cs-card-title">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="cs-body">{description}</AlertDialogPrimitive.Description>
        </div>
        <div className="cs-filter-actions">{children}</div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

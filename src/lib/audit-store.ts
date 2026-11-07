"use client";

import { useSyncExternalStore } from "react";

import { initialAudits, type AuditJob } from "@/lib/audits";

let audits: AuditJob[] = initialAudits.map((audit) => ({
  ...audit,
  config: { ...audit.config },
  pagespeed: audit.pagespeed ? { ...audit.pagespeed } : null,
  report: audit.report ? { ...audit.report } : null,
}));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getAudits() {
  return audits;
}

export function subscribeAudits(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateAudits(updater: (current: AuditJob[]) => AuditJob[]) {
  audits = updater(audits);
  emit();
}

export function useAuditJobs() {
  return useSyncExternalStore(subscribeAudits, getAudits, getAudits);
}

"use client";

import { useSyncExternalStore } from "react";

import { initialReports, type SeoReport } from "@/lib/reports";

let reports: SeoReport[] = initialReports.map((report) => ({ ...report }));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getReports() {
  return reports;
}

export function subscribeReports(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateReports(updater: (current: SeoReport[]) => SeoReport[]) {
  reports = updater(reports);
  emit();
}

export function useReportJobs() {
  return useSyncExternalStore(subscribeReports, getReports, getReports);
}

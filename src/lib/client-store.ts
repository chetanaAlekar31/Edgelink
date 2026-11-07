"use client";

import { useSyncExternalStore } from "react";

import { initialClients, type ClientRecord } from "@/lib/clients";

let clients: ClientRecord[] = initialClients.map((client) => ({ ...client }));
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getClients() {
  return clients;
}

export function subscribeClients(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateClients(updater: (current: ClientRecord[]) => ClientRecord[]) {
  clients = updater(clients);
  emit();
}

export function useClientRecords() {
  return useSyncExternalStore(subscribeClients, getClients, getClients);
}

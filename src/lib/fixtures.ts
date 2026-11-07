import dataforseo from "@/mocks/dataforseo.mock";
import gsc from "@/mocks/gsc.mock";
import { USE_MOCKS } from "@/mocks";
import pagespeed from "@/mocks/pagespeed.mock";
import { notifyWhatsApp } from "@/crawlers/twilio";

export function mocksEnabled() {
  return USE_MOCKS === true;
}

export function readPageSpeed() {
  if (!mocksEnabled()) return null;
  return pagespeed;
}

export function readSearchConsole() {
  if (!mocksEnabled()) return null;
  return gsc;
}

export function readRankings() {
  if (!mocksEnabled()) return null;
  return dataforseo;
}

export type WhatsAppLog = {
  status: string;
  sid: string;
};

let whatsAppLog: Promise<WhatsAppLog | null> | null = null;

export function loadWhatsAppLog(clientId: string, score: number) {
  if (!mocksEnabled()) return Promise.resolve(null);
  if (!whatsAppLog) {
    whatsAppLog = notifyWhatsApp(clientId, null, score).then((result: WhatsAppLog | null) => result ?? null);
  }
  return whatsAppLog;
}

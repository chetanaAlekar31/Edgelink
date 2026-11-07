export function loadPageSpeed(url: string): Promise<unknown>;
export function loadSearchConsole(): Promise<unknown>;
export function loadRankings(): Promise<unknown>;
export function deliverWhatsApp(
  clientId: string,
  pdfPath: string,
  score: number | null,
): Promise<{ status: string; sid: string }>;

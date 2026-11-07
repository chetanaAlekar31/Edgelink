import * as cheerio from "cheerio";

const unavailable = "Not available";

export type CrawlCapture = {
  available: boolean;
  finalUrl: string | null;
  html: string | null;
  reason: string | null;
};

export async function crawlUrl(url: string): Promise<CrawlCapture> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "EdgelinkSEOAudit/1.0" },
    });
    if (!response.ok) {
      return { available: false, finalUrl: response.url || null, html: null, reason: unavailable };
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && !contentType.includes("text")) {
      return { available: false, finalUrl: response.url || null, html: null, reason: unavailable };
    }
    const html = await response.text();
    return { available: true, finalUrl: response.url || url, html, reason: null };
  } catch {
    return { available: false, finalUrl: null, html: null, reason: unavailable };
  } finally {
    clearTimeout(timer);
  }
}

export function analyseOnPage(crawl: CrawlCapture) {
  if (!crawl.available || !crawl.html) {
    return {
      available: false,
      title: null,
      metaDescription: null,
      headings: null,
      imagesMissingAlt: null,
      internalLinks: null,
      brokenLinks: null,
    };
  }
  const $ = cheerio.load(crawl.html);
  const title = $("title").first().text().trim();
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const headings = {
    h1: $("h1").length,
    h2: $("h2").length,
    h3: $("h3").length,
  };
  const images = $("img");
  let imagesMissingAlt = 0;
  images.each((_index, element) => {
    const alt = $(element).attr("alt");
    if (!alt || alt.trim().length === 0) imagesMissingAlt += 1;
  });
  let internalLinks = 0;
  const host = crawl.finalUrl ? new URL(crawl.finalUrl).hostname : "";
  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href") ?? "";
    if (href.startsWith("/") || href.includes(host)) internalLinks += 1;
  });
  return {
    available: true,
    title: title || null,
    metaDescription: metaDescription || null,
    headings,
    imagesMissingAlt,
    internalLinks,
    brokenLinks: null,
  };
}

export function validateSchemaMarkup(crawl: CrawlCapture) {
  if (!crawl.available || !crawl.html) {
    return { available: false, blocks: [] as unknown[], valid: null };
  }
  const $ = cheerio.load(crawl.html);
  const blocks: unknown[] = [];
  let valid = true;
  $('script[type="application/ld+json"]').each((_index, element) => {
    const raw = $(element).text();
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      valid = false;
    }
  });
  return { available: true, blocks, valid: blocks.length > 0 ? valid : null };
}

async function readText(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow" });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkRobotsAndSitemap(websiteUrl: string) {
  let origin: string;
  try {
    origin = new URL(websiteUrl).origin;
  } catch {
    return { available: false, robotsTxt: null, sitemap: null };
  }
  const robots = await readText(`${origin}/robots.txt`);
  const sitemap = await readText(`${origin}/sitemap.xml`);
  if (robots === null && sitemap === null) {
    return { available: false, robotsTxt: null, sitemap: null };
  }
  return {
    available: true,
    robotsTxt: robots === null ? null : { present: true, length: robots.length },
    sitemap: sitemap === null ? null : { present: true, length: sitemap.length },
  };
}

/* eslint-disable @typescript-eslint/no-require-imports */
const { USE_MOCKS } = require("../mocks");
const { getPageSpeed } = require("../crawlers/pagespeed");
const { getSearchConsole } = require("../crawlers/gsc");
const { getRankings } = require("../crawlers/dataforseo");
const { notifyWhatsApp } = require("../crawlers/twilio");

function mocksEnabled() {
  return USE_MOCKS === true || process.env.USE_MOCKS === "true";
}

function missing(message) {
  const error = new Error(message);
  error.name = "MissingConfigurationError";
  return error;
}

async function loadPageSpeed(url) {
  if (!mocksEnabled()) {
    if (!process.env.PAGESPEED_API_KEY) throw missing("PAGESPEED_API_KEY is not configured.");
    throw missing("PageSpeed Insights is not configured for live calls.");
  }
  const result = await getPageSpeed(url);
  if (!result) throw new Error("PageSpeed did not return a result.");
  return result;
}

async function loadSearchConsole() {
  if (!mocksEnabled()) {
    if (!process.env.GSC_CLIENT_EMAIL && !process.env.GSC_CREDENTIALS) {
      throw missing("Google Search Console credentials are not configured.");
    }
    throw missing("Google Search Console is not configured for live calls.");
  }
  const result = await getSearchConsole();
  if (!result) throw new Error("Search Console did not return a result.");
  return result;
}

async function loadRankings() {
  if (!mocksEnabled()) {
    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
      throw missing("DataForSEO credentials are not configured.");
    }
    throw missing("DataForSEO is not configured for live calls.");
  }
  const result = await getRankings();
  if (!result) throw new Error("DataForSEO did not return a result.");
  return result;
}

async function deliverWhatsApp(clientId, pdfPath, score) {
  if (!mocksEnabled()) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      throw missing("Twilio credentials are not configured.");
    }
    throw missing("Twilio WhatsApp is not configured for live calls.");
  }
  const result = await notifyWhatsApp(clientId, pdfPath, score);
  if (!result) throw new Error("WhatsApp notification did not return a result.");
  return result;
}

module.exports = { loadPageSpeed, loadSearchConsole, loadRankings, deliverWhatsApp };
